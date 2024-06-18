module.exports = class Data1718640964000 {
    name = 'Data1718640964000'

    async up(db) {
        await db.query(`ALTER TABLE "token_sent" ADD "tx_hash" text NOT NULL`)
        await db.query(`CREATE INDEX "IDX_5ac816cf47a0d9395dccd211b1" ON "token_sent" ("tx_hash") `)
    }

    async down(db) {
        await db.query(`ALTER TABLE "token_sent" DROP COLUMN "tx_hash"`)
        await db.query(`DROP INDEX "public"."IDX_5ac816cf47a0d9395dccd211b1"`)
    }
}
