CREATE TABLE "movie_lists" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "movie_lists_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "movie_list_items" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "tmdbId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "posterPath" TEXT,
    "contentType" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "movie_list_items_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "movie_list_items_listId_tmdbId_key" ON "movie_list_items"("listId", "tmdbId");
ALTER TABLE "movie_lists" ADD CONSTRAINT "movie_lists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "movie_list_items" ADD CONSTRAINT "movie_list_items_listId_fkey" FOREIGN KEY ("listId") REFERENCES "movie_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
