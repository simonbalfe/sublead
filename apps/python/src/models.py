from pydantic import BaseModel


class SearchSubredditsRequest(BaseModel):
    keywords: list[str]


class SubredditInfo(BaseModel):
    name: str
    subscribers: int
    description: str


class FetchPostsRequest(BaseModel):
    subreddit: str
    limit: int = 50


class FetchHotPostsRequest(BaseModel):
    subreddit: str
    time_filter: str = 'month'
    limit: int = 50


class RedditPostData(BaseModel):
    id: str
    title: str
    selftext: str
    url: str
    created_utc: float
    author: str
    subreddit: str
