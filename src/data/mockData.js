export const DEMO_USERS = {
    'employee@thesl.co.za': {
        password: 'employee123',
        role: 'employee',
        name: 'Sarah Johnson',
        employeeId: 'EMP001',
        department: 'Sales',
        position: 'Sales Manager',
        email: 'sarah.johnson@thesl.co.za',
        phone: '+27 21 123 4567'
    },
    'admin@thesl.co.za': {
        password: 'admin123',
        role: 'admin',
        name: 'Admin User',
        employeeId: 'ADM001',
        department: 'HR',
        position: 'HR Director',
        email: 'admin@thesl.co.za',
        phone: '+27 21 123 4567'
    }
};

export const DEMO_ANNOUNCEMENTS = [
    {
        id: 1,
        type: 'event',
        title: 'Company Year-End Function',
        content: 'Join us for our annual year-end celebration on December 15th at 6 PM. Venue: The Grand Hotel. RSVP by December 10th.',
        date: '2026-03-18',
        author: 'HR Team',
        pinned: true
    },
    {
        id: 2,
        type: 'policy',
        title: 'Updated Remote Work Policy',
        content: 'We have updated our remote work policy to allow up to 3 days per week of remote work for all employees.',
        date: '2026-03-15',
        author: 'HR Team',
        pinned: false
    }
];
