module.exports = class Data1718708826587 {
    name = 'Data1718708826587'

    async up(db) {
        await db.query(`CREATE TABLE "message_processed" ("id" character varying NOT NULL, "block_number" integer NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "message_id" text NOT NULL, "success" boolean NOT NULL, CONSTRAINT "PK_71cd050ff33bac4650ee834568c" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_a2917a627275f0b19fe7c1621d" ON "message_processed" ("block_number") `)
        await db.query(`CREATE INDEX "IDX_aeef6ec5305b0ba859b8cdddcd" ON "message_processed" ("timestamp") `)
        await db.query(`CREATE INDEX "IDX_84149a2084184edbc08d2900af" ON "message_processed" ("message_id") `)
        await db.query(`CREATE INDEX "IDX_569086060c798b8fe6ceb9640b" ON "message_processed" ("success") `)
    }

    async down(db) {
        await db.query(`DROP TABLE "message_processed"`)
        await db.query(`DROP INDEX "public"."IDX_a2917a627275f0b19fe7c1621d"`)
        await db.query(`DROP INDEX "public"."IDX_aeef6ec5305b0ba859b8cdddcd"`)
        await db.query(`DROP INDEX "public"."IDX_84149a2084184edbc08d2900af"`)
        await db.query(`DROP INDEX "public"."IDX_569086060c798b8fe6ceb9640b"`)
    }
}
