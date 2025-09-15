export default () => ({
    database: {
        url: process.env.DATABASE_URL || 
        'postgresql://macbook@localhost:5432/dunwoodchurchdb?schema=public',
    }
})