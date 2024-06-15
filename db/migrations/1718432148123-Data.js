module.exports = class Data1718432148123 {
    name = 'Data1718432148123'

    async up(db) {
        await db.query(`CREATE TABLE "inbound_message" ("id" character varying NOT NULL, "block_number" integer NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "message_id" text NOT NULL, "channel_id" text NOT NULL, "nonce" integer NOT NULL, CONSTRAINT "PK_a013d32c89ba79e84f4d371bd1b" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_f86b5dc5ac7ffe17af9adc3d31" ON "inbound_message" ("block_number") `)
        await db.query(`CREATE INDEX "IDX_db48cacbd9437a58060e2b7f76" ON "inbound_message" ("timestamp") `)
        await db.query(`CREATE INDEX "IDX_0f1782862fde516b5d39eb4096" ON "inbound_message" ("message_id") `)
        await db.query(`CREATE INDEX "IDX_6ab0d01474a23e70c2606f998c" ON "inbound_message" ("channel_id") `)
        await db.query(`CREATE INDEX "IDX_a550f3a81d8cbf9890f2d64154" ON "inbound_message" ("nonce") `)
    }

    async down(db) {
        await db.query(`DROP TABLE "inbound_message"`)
        await db.query(`DROP INDEX "public"."IDX_f86b5dc5ac7ffe17af9adc3d31"`)
        await db.query(`DROP INDEX "public"."IDX_db48cacbd9437a58060e2b7f76"`)
        await db.query(`DROP INDEX "public"."IDX_0f1782862fde516b5d39eb4096"`)
        await db.query(`DROP INDEX "public"."IDX_6ab0d01474a23e70c2606f998c"`)
        await db.query(`DROP INDEX "public"."IDX_a550f3a81d8cbf9890f2d64154"`)
    }
}
