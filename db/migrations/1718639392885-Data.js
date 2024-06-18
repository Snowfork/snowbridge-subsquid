module.exports = class Data1718639392885 {
    name = 'Data1718639392885'

    async up(db) {
        await db.query(`CREATE TABLE "token_sent" ("id" character varying NOT NULL, "block_number" integer NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "token_address" text NOT NULL, "sender_address" text NOT NULL, "destination_para_id" integer NOT NULL, "destination_address" text NOT NULL, "amount" numeric NOT NULL, CONSTRAINT "PK_bacc2f4d7002ad63e1c9773c92f" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_856bf48e7cc8ea502767b298f7" ON "token_sent" ("block_number") `)
        await db.query(`CREATE INDEX "IDX_5f29bb7808675aeb153a6022b6" ON "token_sent" ("timestamp") `)
        await db.query(`CREATE INDEX "IDX_47e5985ad5b2a68a78285c06e1" ON "token_sent" ("token_address") `)
        await db.query(`CREATE INDEX "IDX_a263a93e4810a59ba510df346d" ON "token_sent" ("sender_address") `)
        await db.query(`CREATE INDEX "IDX_6205b80bd5be51e4572f966775" ON "token_sent" ("destination_para_id") `)
        await db.query(`CREATE INDEX "IDX_9c8b06683b007fe3490ce042fd" ON "token_sent" ("destination_address") `)
    }

    async down(db) {
        await db.query(`DROP TABLE "token_sent"`)
        await db.query(`DROP INDEX "public"."IDX_856bf48e7cc8ea502767b298f7"`)
        await db.query(`DROP INDEX "public"."IDX_5f29bb7808675aeb153a6022b6"`)
        await db.query(`DROP INDEX "public"."IDX_47e5985ad5b2a68a78285c06e1"`)
        await db.query(`DROP INDEX "public"."IDX_a263a93e4810a59ba510df346d"`)
        await db.query(`DROP INDEX "public"."IDX_6205b80bd5be51e4572f966775"`)
        await db.query(`DROP INDEX "public"."IDX_9c8b06683b007fe3490ce042fd"`)
    }
}
