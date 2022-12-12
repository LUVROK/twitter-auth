import axios from "axios";
import { auth, Client } from "twitter-api-sdk";
import { OAUTH_TWITTER_ID, OAUTH_TWITTER_SECRET } from "../constants/constants";

export interface IUserProvider {
  email: string;
  name: string;
  id: string;
  retweeted: boolean;
  liked: boolean;
  commented: boolean;
}

export default async function twitter(code: string, url: string): Promise<IUserProvider | undefined> {
  let userProvider: IUserProvider | undefined = undefined;

  try {
    const params = new URLSearchParams({
      code,
      grant_type: "authorization_code",
      code_verifier: "challenge",
      redirect_uri: url,
    });

    const access = await axios({
      method: "POST",
      url: "https://api.twitter.com/2/oauth2/token",
      params,
      headers: {
        "Content-type": "application/x-www-form-urlencoded",
        Authorization: basicAuthHeader(OAUTH_TWITTER_ID, OAUTH_TWITTER_SECRET),
      },
    });

    if (access.data && access.data.access_token) {
      const authClient = new auth.OAuth2User({
        client_id: OAUTH_TWITTER_ID,
        client_secret: OAUTH_TWITTER_SECRET,
        callback: url,
        scopes: ["offline.access", "users.read", "tweet.read", "like.read"],
        token: access.data,
      });

      const client = new Client(authClient);
      const me = await client.users.findMyUser();

      if (me && me.data) {
        const tweets = await client.tweets.usersIdTweets(me.data.id, {
          "tweet.fields": ["referenced_tweets", "reply_settings"],
          max_results: 100,
          since_id: "1596845580680331265",
        });

        const retweeted = tweets.data?.some((d) => d.referenced_tweets!.some((r) => r.id === "1596845580680331265" && r.type === "retweeted")) ?? false;
        // console.log('Retweeted: ', retweeted);

        const likes = await client.tweets.usersIdLikedTweets(me.data.id, {
          max_results: 100,
        });

        const liked = likes.data?.some((d) => d.id === "1596845580680331265") ?? false;
        // console.log('Liked: ', liked);

        const commented =
          tweets.data?.some((d) =>
            // d.text.toLowerCase().includes('@lumbeers') &&
            d.referenced_tweets!.some((r) => r.id === "1596845580680331265" && r.type === "replied_to")
          ) ?? false;

        userProvider = {
          // since twitter does not return email, we construct a dummy email for database
          email: `${me.data.username}.${me.data.id}@example.com`,
          name: me.data.name,
          id: me.data.id,
          retweeted,
          liked,
          commented,
        };
      }
    }

    return userProvider;
  } catch (e) {
    console.error(e);
    return undefined;
  }

  function basicAuthHeader(client_id: string, client_secret: string) {
    return `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString("base64")}`;
  }
}
