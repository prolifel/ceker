import mysql from "mysql2/promise"

export interface dbSetting {
    host: string
    port: number
    user: string
    password: string
    database: string
}

export const getDBSetting = (): dbSetting => {
    return {
        host: process.env.DB_HOST!,
        port: parseInt(process.env.DB_PORT!),
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
        database: process.env.DB_DATABASE!,
    }
}


export const pool = mysql.createPool({
    ...getDBSetting(),
    waitForConnections: true,
    connectionLimit: 10
})
