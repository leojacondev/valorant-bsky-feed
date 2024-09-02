import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription'

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return
    const ops = await getOpsByType(evt)

    // This logs the text of every post off the firehose.
    // Just for fun :)
    // Delete before actually using
    for (const post of ops.posts.creates) {
      console.log(post.record.text)
    }

    const postsToDelete = ops.posts.deletes.map((del) => del.uri)
    const postsToCreate = ops.posts.creates
      .filter((create) => {
        if (!create.record.langs?.includes('pt')) return false
        
        const keywords = [
          /\bvaloran\b/,
          /\bvct\b/,
          /\bloud\b/,
          /\bleviantan\b/,
          /\blev\b/,
          /\bmibr\b/,
          /\bfuria\b/,
          /\baspas\b/,
          /\briot\b/,
          /\bteam liquid\b/,
          /\bsaadhak\b/,
          /\bmwzera\b/,
          /\btuyz\b/,
          /\bcauazin\b/,
          /\bloud.gg\b/,
          /\bfuria.gg\b/,
          /\bvalorant champions\b/
        ]

        const excludedKeywords = [
          "mutuals",
          "moots",
          "sdv",
          "sdvv",
          "follow trick",
          "trick"
        ]
        

        return keywords.some(
          (keyword) => keyword.test(create.record.text)
          &&
          !excludedKeywords.some((keyword) => create.record.text.toLocaleLowerCase().includes(keyword))
        );
      })
      .map((create) => {
        // map alf-related posts to a db row
        return {
          uri: create.uri,
          cid: create.cid,
          indexedAt: new Date().toISOString(),
        }
      })

    if (postsToDelete.length > 0) {
      await this.db
        .deleteFrom('post')
        .where('uri', 'in', postsToDelete)
        .execute()
    }
    if (postsToCreate.length > 0) {
      await this.db
        .insertInto('post')
        .values(postsToCreate)
        .onConflict((oc) => oc.doNothing())
        .execute()
    }
  }
}
