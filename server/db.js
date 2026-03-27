import { createClient } from '@supabase/supabase-js';
import process from 'node:process';
import bcrypt from 'bcryptjs';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Missing Supabase credentials: SUPABASE_URL and SUPABASE_KEY');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function setupDb() {
    try {
        const { error } = await supabase.from('users').select('email').limit(1);
        if (error && error.code !== 'PGRST116') {
            throw error;
        }
        console.log('✓ Connected to Supabase');
    } catch (err) {
        console.error('Supabase check:', err.message);
    }

    return {
        get: async (query, params = []) => queryToSupabase(query, 'single', params),
        all: async (query, params = []) => queryToSupabase(query, 'all', params),
        run: async (query, params = []) => queryToSupabase(query, 'run', params),
        exec: async (sql) => null
    };
}

async function queryToSupabase(query, type, params = []) {
    try {
        const normalizedQuery = query.trim().replace(/\s+/g, ' ');

        // INSERT query
        if (normalizedQuery.toUpperCase().startsWith('INSERT INTO')) {
            const tableMatch = normalizedQuery.match(/INSERT INTO\s+(\w+)/i);
            const columnsMatch = normalizedQuery.match(/\((.*?)\)\s*VALUES/i);
            if (!tableMatch || !columnsMatch) throw new Error('Could not parse INSERT query');
            
            const table = tableMatch[1];
            const columns = columnsMatch[1].split(',').map(c => c.trim());
            const values = {};
            columns.forEach((col, i) => {
                values[col] = params[i];
            });
            const { data, error } = await supabase.from(table).insert([values]).select();
            if (error) throw error;
            const result = data?.[0] || {};
            return { ...result, lastID: result.id };
        }

        // SELECT query
        if (normalizedQuery.toUpperCase().startsWith('SELECT')) {
            const fromMatch = normalizedQuery.match(/FROM\s+(\w+)(?:\s+\w+)?/i);
            if (!fromMatch) throw new Error('Could not parse table name from SELECT');
            const table = fromMatch[1];
            
            // Handle JOINs (specifically for performance_reviews JOIN users)
            let selectStr = '*';
            if (normalizedQuery.match(/LEFT JOIN users/i)) {
                selectStr = '*, users(name)';
            }

            let queryBuilder = supabase.from(table).select(selectStr);

            // Handle WHERE
            const whereMatch = normalizedQuery.match(/WHERE\s+([\s\S]+?)(?:\s+ORDER BY|\s+LIMIT|$)/i);
            if (whereMatch) {
                const whereClause = whereMatch[1];
                const conditions = whereClause.split(/\s+AND\s+/i);
                let paramOffset = 0;
                for (const condition of conditions) {
                    // Strip aliases like p.user_email
                    const cleanCondition = condition.replace(/\w+\./g, '');
                    const eqMatch = cleanCondition.match(/(\w+)\s*=\s*\?/i);
                    if (eqMatch) {
                        queryBuilder = queryBuilder.eq(eqMatch[1], params[paramOffset++]);
                    }
                }
            }

            // Handle ORDER BY
            const orderMatch = normalizedQuery.match(/ORDER BY\s+([\w.]+)(?:\s+(ASC|DESC))?/i);
            if (orderMatch) {
                // Strip alias like p.id -> id
                const field = orderMatch[1].includes('.') ? orderMatch[1].split('.')[1] : orderMatch[1];
                queryBuilder = queryBuilder.order(field, { ascending: orderMatch[2]?.toUpperCase() !== 'DESC' });
            }

            // Handle LIMIT
            const limitMatch = normalizedQuery.match(/LIMIT\s+(\d+|\?)/i);
            if (limitMatch) {
                const limitValue = limitMatch[1] === '?' ? params[params.length - 1] : parseInt(limitMatch[1]);
                queryBuilder = queryBuilder.limit(limitValue);
            }

            const { data, error } = await queryBuilder;
            if (error) throw error;
            
            // Post-process JOIN results to match standard SQLite rows { user_name: ... }
            const rows = (data || []).map(row => {
                const newRow = { ...row };
                if (row.users) {
                    newRow.user_name = Array.isArray(row.users) ? row.users[0]?.name : row.users.name;
                    delete newRow.users;
                }
                return newRow;
            });

            if (type === 'single') {
                return rows?.[0] || null;
            }
            return rows;
        }

        // UPDATE query
        if (normalizedQuery.toUpperCase().startsWith('UPDATE')) {
            const tableMatch = normalizedQuery.match(/UPDATE\s+(\w+)/i);
            const setMatch = normalizedQuery.match(/SET\s+([\s\S]+?)\s+WHERE/i);
            const whereMatch = normalizedQuery.match(/WHERE\s+([\s\S]+?)$/i);
            
            if (tableMatch && setMatch && whereMatch) {
                const table = tableMatch[1];
                const setClause = setMatch[1];
                const whereClause = whereMatch[1];
                
                const updates = {};
                const setParts = setClause.split(',');
                let paramIndex = 0;
                
                setParts.forEach(part => {
                    const match = part.match(/(\w+)\s*=\s*\?/);
                    if (match) {
                        updates[match[1]] = params[paramIndex++];
                    }
                });
                
                let queryBuilder = supabase.from(table).update(updates);
                const whereParts = whereClause.split(/\s+AND\s+/i);
                whereParts.forEach(cond => {
                    const match = cond.match(/(\w+)\s*=\s*\?/);
                    if (match) {
                        queryBuilder = queryBuilder.eq(match[1], params[paramIndex++]);
                    }
                });
                
                const { data, error } = await queryBuilder.select();
                if (error) throw error;
                return data?.[0] || null;
            }
        }

        // DELETE query
        if (normalizedQuery.toUpperCase().startsWith('DELETE FROM')) {
            const tableMatch = normalizedQuery.match(/DELETE FROM\s+(\w+)/i);
            const whereMatch = normalizedQuery.match(/WHERE\s+([\s\S]+?)$/i);
            
            if (tableMatch && whereMatch) {
                const table = tableMatch[1];
                const whereClause = whereMatch[1];
                
                let queryBuilder = supabase.from(table).delete();
                const whereParts = whereClause.split(/\s+AND\s+/i);
                let paramIndex = 0;
                whereParts.forEach(cond => {
                    const match = cond.match(/(\w+)\s*=\s*\?/);
                    if (match) {
                        queryBuilder = queryBuilder.eq(match[1], params[paramIndex++]);
                    }
                });
                const { data, error } = await queryBuilder.select();
                if (error) throw error;
                return data;
            }
        }

        console.warn('Unsupported query:', query);
        return type === 'single' ? null : [];
    } catch (err) {
        console.error('Supabase Query Error:', err.message || err);
        throw err; // Re-throw to be caught by server.js error handlers
    }
}


