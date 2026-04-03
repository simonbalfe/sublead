from fastapi import APIRouter, HTTPException
from src.reddit import get_reddit_client
from src.models import (
    SearchSubredditsRequest,
    SubredditInfo,
    FetchPostsRequest,
    FetchHotPostsRequest,
    RedditPostData,
)

router = APIRouter()


def post_to_dict(post) -> dict:
    return {
        'id': post.id,
        'title': post.title,
        'selftext': post.selftext or '',
        'url': f'https://www.reddit.com{post.permalink}',
        'created_utc': post.created_utc,
        'author': str(post.author) if post.author else '[deleted]',
        'subreddit': str(post.subreddit),
    }


@router.post('/search-subreddits')
def search_subreddits(request: SearchSubredditsRequest):
    reddit = get_reddit_client()
    seen = set()
    results = []

    for keyword in request.keywords:
        try:
            for sub in reddit.subreddits.search(keyword, limit=10):
                if sub.display_name not in seen and sub.subscribers and sub.subscribers >= 1000:
                    seen.add(sub.display_name)
                    results.append({
                        'name': sub.display_name,
                        'subscribers': sub.subscribers,
                        'description': sub.public_description or '',
                    })
        except Exception:
            continue

    results.sort(key=lambda x: x['subscribers'], reverse=True)
    return {'subreddits': results}


@router.post('/fetch-new-posts')
def fetch_new_posts(request: FetchPostsRequest):
    reddit = get_reddit_client()
    try:
        subreddit = reddit.subreddit(request.subreddit)
        posts = [post_to_dict(p) for p in subreddit.new(limit=request.limit)]
        return {'posts': posts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/fetch-hot-posts')
def fetch_hot_posts(request: FetchHotPostsRequest):
    reddit = get_reddit_client()
    try:
        subreddit = reddit.subreddit(request.subreddit)
        posts = [post_to_dict(p) for p in subreddit.hot(limit=request.limit)]
        return {'posts': posts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
