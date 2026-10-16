-- AlterTable
ALTER TABLE "public"."book_copies" ALTER COLUMN "book_id" SET DATA TYPE BIGINT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6);

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_book_copies_books') THEN
    ALTER TABLE "public"."book_copies" ADD CONSTRAINT "fk_book_copies_books" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;

-- AlterTable
ALTER TABLE "public"."books" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "public"."borrower_status_history" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "public"."borrowers" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "public"."faqs" ADD COLUMN IF NOT EXISTS "code" VARCHAR(100) NOT NULL,
ADD COLUMN IF NOT EXISTS "metadata" JSONB,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "public"."loans" ALTER COLUMN "loan_date" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "due_date" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "public"."loans_copies" ALTER COLUMN "return_date" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "public"."session" ALTER COLUMN "expire" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "faqs_code_key" ON "public"."faqs"("code");
