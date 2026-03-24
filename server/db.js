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
        // INSERT query
        if (query.toUpperCase().includes('INSERT INTO')) {
            const tableMatch = query.match(/INSERT INTO\s+(\w+)\s*\(/i);
            const columnsMatch = query.match(/\((.*?)\)\s*VALUES/i);
            if (tableMatch && columnsMatch) {
                const table = tableMatch[1];
                const columns = columnsMatch[1].split(',').map(c => c.trim());
                const values = {};
                columns.forEach((col, i) => {
                    values[col] = params[i];
                });
                const { data, error } = await supabase.from(table).insert([values]).select();
                if (error) throw error;
                return data?.[0] || null;
            }
        }

        // SELECT with WHERE
        if (query.toUpperCase().includes('SELECT') && query.toUpperCase().includes('WHERE')) {
            const tableMatch = query.match(/FROM\s+(\w+)/i);
            const whereMatch = query.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/i);
            if (tableMatch && whereMatch) {
                const table = tableMatch[1];
                const whereClause = whereMatch[1];
                
                let queryBuilder = supabase.from(table).select('*');
                
                const conditions = whereClause.split(/\s+AND\s+/i);
                let paramIndex = 0;
                for (const condition of conditions) {
                    const match = condition.match(/(\w+)\s*=\s*\?/i);
                    if (match) {
                        queryBuilder = queryBuilder.eq(match[1], params[paramIndex++]);
                    }
                }
                
                const { data, error } = await queryBuilder;
                if (error) throw error;
                
                if (type === 'single') {
                    return data?.[0] || null;
                }
                return data || [];
            }
        }

        // SELECT all
        if (query.toUpperCase().includes('SELECT')) {
            const tableMatch = query.match(/FROM\s+(\w+)/i);
            if (tableMatch) {
                const table = tableMatch[1];
                const { data, error } = await supabase.from(table).select('*');
                if (error) throw error;
                return type === 'single' ? data?.[0] || null : data || [];
            }
        }

        // UPDATE query
        if (query.toUpperCase().includes('UPDATE')) {
            const tableMatch = query.match(/UPDATE\s+(\w+)\s+SET/i);
            const setMatch = query.match(/SET\s+(.+?)\s+WHERE/i);
            const whereMatch = query.match(/WHERE\s+(.+?)(?:\s+LIMIT|$)/i);
            
            if (tableMatch && setMatch && whereMatch) {
                const table = tableMatch[1];
                const setClause = setMatch[1];
                const whereClause = whereMatch[1];
                
                const updates = {};
                const setParts = setClause.split(',');
                setParts.forEach((part, i) => {
                    const [field] = part.split('=');
                    updates[field.trim()] = params[i];
                });
                
                let queryBuilder = supabase.from(table);
                const whereMatch2 = whereClause.match(/(\w+)\s*=\s*\?/i);
                if (whereMatch2) {
                    queryBuilder = queryBuilder.eq(whereMatch2[1], params[setParts.length]);
                }
                
                const { data, error } = await queryBuilder.update(updates).select();
                if (error) throw error;
                return data?.[0] || null;
            }
        }

        // DELETE query
        if (query.toUpperCase().includes('DELETE FROM')) {
            const tableMatch = query.match(/DELETE FROM\s+(\w+)/i);
            const whereMatch = query.match(/WHERE\s+(.+?)(?:\s+LIMIT|$)/i);
            
            if (tableMatch && whereMatch) {
                const table = tableMatch[1];
                const whereClause = whereMatch[1];
                
                const fieldMatch = whereClause.match(/(\w+)\s*=\s*\?/i);
                if (fieldMatch) {
                    const { data, error } = await supabase
                        .from(table)
                        .delete()
                        .eq(fieldMatch[1], params[0]);
                    if (error) throw error;
                    return data;
                }
            }
        }

        console.warn('Unsupported query:', query);
        return type === 'single' ? null : [];
    } catch (err) {
        console.error('Query error:', err);
        return type === 'single' ? null : [];
    }
}
