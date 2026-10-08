CREATE TYPE "public"."ad_kind" AS ENUM('adsense', 'house');--> statement-breakpoint
CREATE TYPE "public"."challenge_status" AS ENUM('pending', 'accepted', 'declined', 'expired', 'done');--> statement-breakpoint
CREATE TYPE "public"."friendship_status" AS ENUM('pending', 'accepted');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'paid', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."passage_type" AS ENUM('paragraph', 'dialogue', 'quote');--> statement-breakpoint
CREATE TYPE "public"."price_type" AS ENUM('free', 'coins', 'level', 'achievement', 'premium');--> statement-breakpoint
CREATE TYPE "public"."race_kind" AS ENUM('public', 'private', 'challenge', 'practice');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('open', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."skin_category" AS ENUM('car', 'animal', 'vehicle', 'caret', 'track');--> statement-breakpoint
CREATE TYPE "public"."stat_kind" AS ENUM('key', 'pair', 'word');--> statement-breakpoint
CREATE TABLE "ad_inquiries" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"company" text,
	"budget" text,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ad_slots" (
	"id" text PRIMARY KEY NOT NULL,
	"placement" text NOT NULL,
	"kind" "ad_kind" DEFAULT 'house' NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"adsense_slot" text,
	"house_image" text,
	"house_link" text,
	"house_alt" text,
	"advertiser" text,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"impressions" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"is_anonymous" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"reward_coins" integer DEFAULT 0 NOT NULL,
	"reward_skin_id" text,
	"reward_emoji" text
);
--> statement-breakpoint
CREATE TABLE "coin_ledger" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"delta" integer NOT NULL,
	"balance" integer NOT NULL,
	"reason" text NOT NULL,
	"ref_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emoji_loadouts" (
	"user_id" text PRIMARY KEY NOT NULL,
	"slots" text[] NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"item_type" text NOT NULL,
	"item_id" text NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"dodo_checkout_id" text,
	"dodo_payment_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_dodoPaymentId_unique" UNIQUE("dodo_payment_id")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"coins" integer DEFAULT 0 NOT NULL,
	"races" integer DEFAULT 0 NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"best_wpm" real DEFAULT 0 NOT NULL,
	"win_streak" integer DEFAULT 0 NOT NULL,
	"best_win_streak" integer DEFAULT 0 NOT NULL,
	"equipped_skin_id" text DEFAULT 'hatchback' NOT NULL,
	"equipped_caret_id" text DEFAULT 'caret-line' NOT NULL,
	"equipped_track_id" text DEFAULT 'track-plain' NOT NULL,
	"theme_id" text DEFAULT 'paper' NOT NULL,
	"mode" text DEFAULT 'system' NOT NULL,
	"stats_private" boolean DEFAULT false NOT NULL,
	"last_daily_bonus_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "skins" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" "skin_category" NOT NULL,
	"price_type" "price_type" NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"achievement_id" text,
	"dodo_product_id" text,
	"asset" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "themes" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"price_type" "price_type" NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"achievement_id" text,
	"dodo_product_id" text
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"user_id" text NOT NULL,
	"achievement_id" text NOT NULL,
	"unlocked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_achievements_user_id_achievement_id_pk" PRIMARY KEY("user_id","achievement_id")
);
--> statement-breakpoint
CREATE TABLE "user_emojis" (
	"user_id" text NOT NULL,
	"emoji" text NOT NULL,
	"source" text NOT NULL,
	"acquired_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_emojis_user_id_emoji_pk" PRIMARY KEY("user_id","emoji")
);
--> statement-breakpoint
CREATE TABLE "user_skins" (
	"user_id" text NOT NULL,
	"skin_id" text NOT NULL,
	"source" text NOT NULL,
	"acquired_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_skins_user_id_skin_id_pk" PRIMARY KEY("user_id","skin_id")
);
--> statement-breakpoint
CREATE TABLE "user_themes" (
	"user_id" text NOT NULL,
	"theme_id" text NOT NULL,
	"source" text NOT NULL,
	"acquired_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_themes_user_id_theme_id_pk" PRIMARY KEY("user_id","theme_id")
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "authors" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"birth_year" smallint,
	"death_year" smallint
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" text PRIMARY KEY NOT NULL,
	"gutenberg_id" integer NOT NULL,
	"title" text NOT NULL,
	"author_id" text NOT NULL,
	"publication_year" smallint NOT NULL,
	"original_language" text NOT NULL,
	"translator" text,
	"edition" text NOT NULL,
	"source_url" text NOT NULL,
	"release_date" text,
	"updated_date" text,
	"licence" text DEFAULT 'public-domain' NOT NULL,
	CONSTRAINT "books_gutenbergId_unique" UNIQUE("gutenberg_id")
);
--> statement-breakpoint
CREATE TABLE "favourite_passages" (
	"user_id" text NOT NULL,
	"passage_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favourite_passages_user_id_passage_id_pk" PRIMARY KEY("user_id","passage_id")
);
--> statement-breakpoint
CREATE TABLE "passage_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"passage_id" text NOT NULL,
	"user_id" text,
	"reason" text NOT NULL,
	"note" text,
	"status" "report_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "passages" (
	"id" text PRIMARY KEY NOT NULL,
	"book_id" text NOT NULL,
	"text" text NOT NULL,
	"chapter_number" integer,
	"chapter_title" text,
	"paragraph_number" integer NOT NULL,
	"offset" integer NOT NULL,
	"type" "passage_type" NOT NULL,
	"speaker" text,
	"difficulty" smallint NOT NULL,
	"checksum" text NOT NULL,
	"context_before" text DEFAULT '' NOT NULL,
	"context_after" text DEFAULT '' NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"imported_at" timestamp with time zone NOT NULL,
	"script_version" text NOT NULL,
	CONSTRAINT "passages_checksum_unique" UNIQUE("checksum")
);
--> statement-breakpoint
CREATE TABLE "player_key_stats" (
	"user_id" text NOT NULL,
	"kind" "stat_kind" NOT NULL,
	"key" text NOT NULL,
	"hits" integer DEFAULT 0 NOT NULL,
	"misses" integer DEFAULT 0 NOT NULL,
	"total_ms" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "player_key_stats_user_id_kind_key_pk" PRIMARY KEY("user_id","kind","key")
);
--> statement-breakpoint
CREATE TABLE "player_stats_daily" (
	"user_id" text NOT NULL,
	"day" date NOT NULL,
	"races" integer DEFAULT 0 NOT NULL,
	"real_races" integer DEFAULT 0 NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"real_wins" integer DEFAULT 0 NOT NULL,
	"podiums" integer DEFAULT 0 NOT NULL,
	"wpm_sum" real DEFAULT 0 NOT NULL,
	"best_wpm" real DEFAULT 0 NOT NULL,
	"accuracy_sum" real DEFAULT 0 NOT NULL,
	"chars" integer DEFAULT 0 NOT NULL,
	"errors" integer DEFAULT 0 NOT NULL,
	"time_ms" integer DEFAULT 0 NOT NULL,
	"hours" integer[] DEFAULT '{}' NOT NULL,
	CONSTRAINT "player_stats_daily_user_id_day_pk" PRIMARY KEY("user_id","day")
);
--> statement-breakpoint
CREATE TABLE "race_keystrokes" (
	"result_id" bigint PRIMARY KEY NOT NULL,
	"data" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "race_results" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"race_id" text NOT NULL,
	"user_id" text,
	"is_bot" boolean DEFAULT false NOT NULL,
	"display_name" text NOT NULL,
	"passage_id" text NOT NULL,
	"placement" smallint NOT NULL,
	"finished" boolean DEFAULT true NOT NULL,
	"wpm" real NOT NULL,
	"raw_wpm" real NOT NULL,
	"accuracy" real NOT NULL,
	"time_ms" integer NOT NULL,
	"chars" integer NOT NULL,
	"errors" integer NOT NULL,
	"room_size" smallint NOT NULL,
	"real_opponents" smallint NOT NULL,
	"bot_opponents" smallint NOT NULL,
	"samples" real[] DEFAULT '{}' NOT NULL,
	"consistency" real,
	"flagged" boolean DEFAULT false NOT NULL,
	"flag_reason" text,
	"coins_earned" integer DEFAULT 0 NOT NULL,
	"xp_earned" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "races" (
	"id" text PRIMARY KEY NOT NULL,
	"passage_id" text NOT NULL,
	"kind" "race_kind" DEFAULT 'public' NOT NULL,
	"challenge_id" text,
	"real_players" smallint NOT NULL,
	"bot_players" smallint NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "challenges" (
	"id" text PRIMARY KEY NOT NULL,
	"from_user_id" text NOT NULL,
	"to_user_id" text,
	"status" "challenge_status" DEFAULT 'pending' NOT NULL,
	"room_id" text NOT NULL,
	"passage_id" text,
	"rematch_of" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_reports" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"reporter_id" text,
	"reported_name" text NOT NULL,
	"reported_user_id" text,
	"room_id" text NOT NULL,
	"message" text NOT NULL,
	"reason" text,
	"status" "report_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "friendships" (
	"requester_id" text NOT NULL,
	"addressee_id" text NOT NULL,
	"status" "friendship_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"accepted_at" timestamp with time zone,
	CONSTRAINT "friendships_requester_id_addressee_id_pk" PRIMARY KEY("requester_id","addressee_id")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_ledger" ADD CONSTRAINT "coin_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emoji_loadouts" ADD CONSTRAINT "emoji_loadouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skins" ADD CONSTRAINT "skins_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "themes" ADD CONSTRAINT "themes_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_emojis" ADD CONSTRAINT "user_emojis_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skins" ADD CONSTRAINT "user_skins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skins" ADD CONSTRAINT "user_skins_skin_id_skins_id_fk" FOREIGN KEY ("skin_id") REFERENCES "public"."skins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_themes" ADD CONSTRAINT "user_themes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_themes" ADD CONSTRAINT "user_themes_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favourite_passages" ADD CONSTRAINT "favourite_passages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favourite_passages" ADD CONSTRAINT "favourite_passages_passage_id_passages_id_fk" FOREIGN KEY ("passage_id") REFERENCES "public"."passages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passage_reports" ADD CONSTRAINT "passage_reports_passage_id_passages_id_fk" FOREIGN KEY ("passage_id") REFERENCES "public"."passages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passage_reports" ADD CONSTRAINT "passage_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passages" ADD CONSTRAINT "passages_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_key_stats" ADD CONSTRAINT "player_key_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_stats_daily" ADD CONSTRAINT "player_stats_daily_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "race_keystrokes" ADD CONSTRAINT "race_keystrokes_result_id_race_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."race_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "race_results" ADD CONSTRAINT "race_results_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "race_results" ADD CONSTRAINT "race_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "race_results" ADD CONSTRAINT "race_results_passage_id_passages_id_fk" FOREIGN KEY ("passage_id") REFERENCES "public"."passages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "races" ADD CONSTRAINT "races_passage_id_passages_id_fk" FOREIGN KEY ("passage_id") REFERENCES "public"."passages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_reports" ADD CONSTRAINT "chat_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_reports" ADD CONSTRAINT "chat_reports_reported_user_id_users_id_fk" FOREIGN KEY ("reported_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_addressee_id_users_id_fk" FOREIGN KEY ("addressee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_id_index" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_index" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verifications_identifier_index" ON "verifications" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "coin_ledger_user_id_created_at_index" ON "coin_ledger" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "orders_user_id_index" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "passage_reports_passage_id_index" ON "passage_reports" USING btree ("passage_id");--> statement-breakpoint
CREATE INDEX "passage_reports_status_index" ON "passage_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "passages_book_id_index" ON "passages" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "passages_difficulty_index" ON "passages" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "race_results_user_id_created_at_index" ON "race_results" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "race_results_passage_id_wpm_index" ON "race_results" USING btree ("passage_id","wpm");--> statement-breakpoint
CREATE INDEX "race_results_created_at_index" ON "race_results" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "races_started_at_index" ON "races" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "challenges_to_user_id_status_index" ON "challenges" USING btree ("to_user_id","status");--> statement-breakpoint
CREATE INDEX "friendships_addressee_id_index" ON "friendships" USING btree ("addressee_id");