CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "analysis" (
	"id" text PRIMARY KEY NOT NULL,
	"issue_id" text NOT NULL,
	"user_id" text NOT NULL,
	"overall_score" real NOT NULL,
	"verdict" text NOT NULL,
	"summary" text NOT NULL,
	"difficulty" text NOT NULL,
	"scope" text NOT NULL,
	"availability" text NOT NULL,
	"estimated_hours_min" real,
	"estimated_hours_max" real,
	"breakdown" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"positives" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"concerns" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"technologies" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"starting_points" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ai" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dismissed_opportunity" (
	"user_id" text NOT NULL,
	"issue_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dismissed_opportunity_user_id_issue_id_pk" PRIMARY KEY("user_id","issue_id")
);
--> statement-breakpoint
CREATE TABLE "issue" (
	"id" text PRIMARY KEY NOT NULL,
	"github_id" integer NOT NULL,
	"repository_id" text NOT NULL,
	"number" integer NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"html_url" text NOT NULL,
	"labels" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"state" text DEFAULT 'open' NOT NULL,
	"author" text,
	"author_association" text,
	"assignees" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"reaction_count" integer DEFAULT 0 NOT NULL,
	"comments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"linked_pull_requests" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"collected_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"contribution_types" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"time_commitment" text DEFAULT '2-5h' NOT NULL,
	"experience_level" text DEFAULT 'intermediate' NOT NULL,
	"onboarded_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repository" (
	"id" text PRIMARY KEY NOT NULL,
	"github_id" integer NOT NULL,
	"owner" text NOT NULL,
	"name" text NOT NULL,
	"full_name" text NOT NULL,
	"description" text,
	"html_url" text NOT NULL,
	"primary_language" text,
	"languages" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"topics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"stars" integer DEFAULT 0 NOT NULL,
	"forks" integer DEFAULT 0 NOT NULL,
	"open_issues" integer DEFAULT 0 NOT NULL,
	"license" text,
	"is_archived" boolean DEFAULT false NOT NULL,
	"is_fork" boolean DEFAULT false NOT NULL,
	"has_contributing_guide" boolean DEFAULT false NOT NULL,
	"activity" jsonb,
	"created_at" timestamp with time zone,
	"pushed_at" timestamp with time zone,
	"last_activity_at" timestamp with time zone,
	"collected_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_opportunity" (
	"user_id" text NOT NULL,
	"issue_id" text NOT NULL,
	"score_at_save" real NOT NULL,
	"status_note" text,
	"status_changed_at" timestamp with time zone,
	"last_checked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_opportunity_user_id_issue_id_pk" PRIMARY KEY("user_id","issue_id")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_event" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"issue_id" text,
	"type" text NOT NULL,
	"technologies" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"contribution_types" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"difficulty" text,
	"dimension_scores" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_skill" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"skill" text NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	"github_id" text,
	"github_login" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis" ADD CONSTRAINT "analysis_issue_id_issue_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis" ADD CONSTRAINT "analysis_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dismissed_opportunity" ADD CONSTRAINT "dismissed_opportunity_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dismissed_opportunity" ADD CONSTRAINT "dismissed_opportunity_issue_id_issue_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue" ADD CONSTRAINT "issue_repository_id_repository_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repository"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_opportunity" ADD CONSTRAINT "saved_opportunity_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_opportunity" ADD CONSTRAINT "saved_opportunity_issue_id_issue_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_event" ADD CONSTRAINT "user_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_event" ADD CONSTRAINT "user_event_issue_id_issue_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issue"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skill" ADD CONSTRAINT "user_skill_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "analysis_issue_user_unique" ON "analysis" USING btree ("issue_id","user_id");--> statement-breakpoint
CREATE INDEX "analysis_user_score_idx" ON "analysis" USING btree ("user_id","overall_score");--> statement-breakpoint
CREATE UNIQUE INDEX "issue_github_id_unique" ON "issue" USING btree ("github_id");--> statement-breakpoint
CREATE INDEX "issue_repository_idx" ON "issue" USING btree ("repository_id");--> statement-breakpoint
CREATE INDEX "issue_state_idx" ON "issue" USING btree ("state");--> statement-breakpoint
CREATE UNIQUE INDEX "repository_github_id_unique" ON "repository" USING btree ("github_id");--> statement-breakpoint
CREATE UNIQUE INDEX "repository_full_name_unique" ON "repository" USING btree ("full_name");--> statement-breakpoint
CREATE INDEX "repository_language_idx" ON "repository" USING btree ("primary_language");--> statement-breakpoint
CREATE INDEX "saved_opportunity_user_idx" ON "saved_opportunity" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_event_user_idx" ON "user_event" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_skill_unique" ON "user_skill" USING btree ("user_id","skill","type");--> statement-breakpoint
CREATE INDEX "user_skill_user_idx" ON "user_skill" USING btree ("user_id");