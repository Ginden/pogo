This project is basically standalone ETL pipeline.

It loads data from `gamemaster.json` file to PostgreSQL database, defines useful functions.


## Prerequisites

* Docker with Compose plugin installed
* Node.js

## Building project

1. Run `npm ci`
2. Run `docker compose up -d`
3. Run `npm run load-data ../gamemaster.json`

If you modify a source code, `npm run build` will rebuild the project.

## Running queries

Run `npm run psql` to enter psql shell for our database

Or connect with your favorite SQL client to `localhost:25432` with credentials `pogo:pogo`
