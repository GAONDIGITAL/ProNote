import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import { getSession } from 'next-auth/react';
import { useState } from 'react';
import axios from 'axios';
import React from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import HeadMeta from '../../components/Layouts/HeadMeta'

export const getServerSideProps: GetServerSideProps = async (context: GetServerSidePropsContext) => {
    const session = await getSession(context);
    //console.log(context, session);

    const axiosData = { module: 'notesLoadInfinite', user: session?.user.id, page: 1 };
    const result = await axios.post(`${process.env.PUBLIC_URL}/api/notes`, axiosData);

    const serverData = { hasmore: result.data[1][0].nextPage, notes: result.data[0], session: session };
    //console.log(serverData);
    
    return {
        props: {
            serverData,
        },
    };
};

const ssr = ({ serverData }: any) => {
    //console.log(serverData);

    let initPage, initHasmore;
    if (serverData.hasmore) {
        initPage = 2;
        initHasmore = true;
    } else {
        initPage = 1;
        initHasmore = false;
    }

    const [page, setPage] = useState(initPage);
    const [hasMore, setHasMore] = useState(initHasmore);
    const [notesList, setNotesList] = useState(serverData.notes);
    const [fetching, setFetching] = useState(false);

    const notesLoad = async () => {
        if (serverData.session) {
            if (fetching) {
                return;
            }

            setFetching(true);

            try {
                const axiosData = { module: 'notesLoadInfinite', user: serverData.session?.user.id, page: page };
                const result = await axios.post('/api/notes', axiosData);

                if (result.data[1][0].nextPage === 1) setHasMore(true); else setHasMore(false);

                setPage(result.data[1][0].page + 1);
                setNotesList([...notesList, ...result.data[0]]);
            } finally {
                setFetching(false);
            }
        }
    };
    
    const [isShowNoteMenu, setIsShowNoteMenu] = useState(false);

    return (
        <div>
            <HeadMeta title="SSR | Pro-Note" description="SSR PAGE..." url="http://localhost:3000" image="/assets/images/ProNoteLogo.png" />

            <div className="relative flex h-full gap-5 sm:h-[calc(100vh_-_150px)]">
                <div className={`absolute z-10 hidden h-full w-full rounded-md bg-black/60 ${isShowNoteMenu ? '!block xl:!hidden' : ''}`} onClick={() => setIsShowNoteMenu(!isShowNoteMenu)}></div>
                <div
                    className={`panel
                    absolute
                    z-10
                    hidden
                    h-full
                    w-[240px]
                    flex-none
                    space-y-4
                    overflow-hidden
                    p-4
                    ltr:rounded-r-none
                    rtl:rounded-l-none
                    ltr:lg:rounded-r-md rtl:lg:rounded-l-md
                    xl:relative xl:block
                    xl:h-auto ${isShowNoteMenu ? '!block h-full ltr:left-0 rtl:right-0' : 'hidden shadow'}`}
                >
                    <div className="flex h-full flex-col pb-16">
                        <div className="flex items-center text-center">
                            <div>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
                                    <path
                                        d="M20.3116 12.6473L20.8293 10.7154C21.4335 8.46034 21.7356 7.3328 21.5081 6.35703C21.3285 5.58657 20.9244 4.88668 20.347 4.34587C19.6157 3.66095 18.4881 3.35883 16.2331 2.75458C13.978 2.15033 12.8504 1.84821 11.8747 2.07573C11.1042 2.25537 10.4043 2.65945 9.86351 3.23687C9.27709 3.86298 8.97128 4.77957 8.51621 6.44561C8.43979 6.7254 8.35915 7.02633 8.27227 7.35057L8.27222 7.35077L7.75458 9.28263C7.15033 11.5377 6.84821 12.6652 7.07573 13.641C7.25537 14.4115 7.65945 15.1114 8.23687 15.6522C8.96815 16.3371 10.0957 16.6392 12.3508 17.2435L12.3508 17.2435C14.3834 17.7881 15.4999 18.0873 16.415 17.9744C16.5152 17.9621 16.6129 17.9448 16.7092 17.9223C17.4796 17.7427 18.1795 17.3386 18.7203 16.7612C19.4052 16.0299 19.7074 14.9024 20.3116 12.6473Z"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                    />
                                    <path
                                        opacity="0.5"
                                        d="M16.415 17.9741C16.2065 18.6126 15.8399 19.1902 15.347 19.6519C14.6157 20.3368 13.4881 20.6389 11.2331 21.2432C8.97798 21.8474 7.85044 22.1495 6.87466 21.922C6.10421 21.7424 5.40432 21.3383 4.86351 20.7609C4.17859 20.0296 3.87647 18.9021 3.27222 16.647L2.75458 14.7151C2.15033 12.46 1.84821 11.3325 2.07573 10.3567C2.25537 9.58627 2.65945 8.88638 3.23687 8.34557C3.96815 7.66065 5.09569 7.35853 7.35077 6.75428C7.77741 6.63996 8.16368 6.53646 8.51621 6.44531"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                    />
                                    <path d="M11.7769 10L16.6065 11.2941" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    <path opacity="0.5" d="M11 12.8975L13.8978 13.6739" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold ltr:ml-3 rtl:mr-3">SSR</h3>
                        </div>
                    </div>
                </div>
                <div className="panel h-full flex-1">
                    <div style={{ height: '100%', overflow: 'hidden'}}>
                        <PerfectScrollbar className="relative h-[calc(100vh-80px)]">
                            {notesList ? (
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                                    {notesList.map((note: any) => {
                                        return (
                                            <div key={note.id} className={`panel bg-${note.tagColor}-light shadow-${note.tagColor}`}>
                                                <h4 className="font-semibold text-start line-clamp-1">{note.title}</h4>
                                                <div className="mt-3 text-white-dark text-justify line-clamp-6 break-all" style={{minHeight: '120px'}}>{note.description}</div>
                                                <div className="mt-3">
                                                    <span className={`badge bg-${note.tagColor} rounded-full mr-1`}>{note.tagTitle}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex h-full min-h-[400px] items-center justify-center text-lg font-semibold sm:min-h-[300px]">No data available</div>
                            )}
                        </PerfectScrollbar>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ssr;
