import React, {useEffect, useState} from 'react';
import {NextPage} from "next";
import useSWR from 'swr';
import Link from "next/link";
import {Post, Sub} from "../types";
import axios from "axios";
import Image from "next/image";
import {useAuthState} from "../context/auth";
import useSWRInfinite from 'swr/infinite';
import PostCard from "../components/PostCard";

const Home: NextPage = () => {
    const {authenticated} = useAuthState();
    const fetcher = async (url: string) => {
        return await axios.get(url).then(res => res.data)
    }
    const address = "http://localhost:4000/api/subs/sub/topSubs";
    const getKey = (pageIndex: number, previousPageData: Post[]) => {
        if (previousPageData && !previousPageData.length) return null;
        return `/posts?page=${pageIndex}`;
    }

    const {data, error, size: page, setSize: setPage, isValidating, mutate} = useSWRInfinite<Post[]>(getKey);
    const isInitialLoading = !data && !error;
    const posts: Post[] = data ? ([] as Post[]).concat(...data) : [];
    const {data: topSubs} = useSWR<Sub[]>(address, fetcher);

    const [observedPost, setObservedPost] = useState("");

    useEffect(() => {
        if (!posts || posts.length === 0) return;
        // 마지막 post id 가져오기
        const id = posts[posts.length - 1].identifier;
        if (id !== observedPost) {
            setObservedPost(id);
            observeElement(document.getElementById(id));
        }
    }, [posts])

    const observeElement = (element: HTMLElement | null) => {
        if (!element) return;
        // 브라우저 뷰포트(ViewPort)와 설정한 요소(Element)의 교차점을 관찰
        const observer = new IntersectionObserver(
            // entries는 IntersectionObserverEntry 인스턴스의 배열
            (entries) => {
                // isIntersecting: 관찰 대상의 교차 상태(Boolean)
                if (entries[0].isIntersecting === true) {
                    console.log("마지막 포스트에 왔습니다.");
                    setPage(page + 1);
                    observer.unobserve(element);
                }
            },
            {threshold: 1}
        );
        // 대상 요소의 관찰을 시작
        observer.observe(element);
    }

    return (
        <div className='flex max-w-5xl px-4 pt-5 mx-auto'>
            {/* 포스트 리스트 */}
            <div className='w-full md:mr-3 md:w-8/12'>
                {isInitialLoading && <p className="text-lg text-center">로딩중입니다...</p>}
                {posts?.map(post => (
                    <PostCard
                        key={post.identifier}
                        post={post}
                        mutate={mutate}
                    />
                ))}
            </div>
            {/* 사이드바 */}
            <div className='hidden w-4/12 ml-3 md:block'>
                <div className='bg-white border rounded'>
                    <div className='p-4 border-b'>
                        <p className='text-lg font-semibold text-center'>상위 커뮤니티</p>
                    </div>

                    {/* 커뮤니티 리스트 */}
                    <div>
                        {topSubs?.map((sub) => (
                            <div
                                key={sub.name}
                                className="flex items-center px-4 py-2 text-xs border-b"
                            >
                                <Link href={`/r/${sub.name}`}>
                                    <Image
                                        src={sub.imageUrl}
                                        className="rounded-full cursor-pointer"
                                        alt="Sub"
                                        width={24}
                                        height={24}
                                    />
                                </Link>
                                <Link href={`/r/${sub.name}`}>
                                    /r/{sub.name}
                                </Link>
                                <p className='ml-auto font-medium'>{sub.postCount}</p>
                            </div>
                        ))}
                    </div>

                    {authenticated &&
                        <div className='w-full py-6 text-center'>
                            <Link className='w-full p-2 text-center text-white bg-gray-400 rounded' href="/subs/create">
                                커뮤니티 만들기
                            </Link>
                        </div>
                    }
                </div>
            </div>
        </div>
    );
};

export default Home;
