import PerfectScrollbar from 'react-perfect-scrollbar';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../../store';
import Dropdown from '../../components/Dropdown';
import { setPageTitle } from '../../store/themeConfigSlice';
import axios from 'axios';
import moment from 'moment';
import { BsGear, BsPlus, BsArrowDownUp, BsCheckLg, BsTrash, BsCheck2All } from 'react-icons/bs';
import { FiLoader } from 'react-icons/fi';
import { ReactSortable } from 'react-sortablejs';
import React from 'react';
import 'react-quill/dist/quill.snow.css';
import dynamic from 'next/dynamic';
const ReactQuill = dynamic(import('react-quill'), { ssr: false });

const Notes = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Notes'));
    });

    interface Note {
        id: string,
        tags: string,
        title: string,
        description: string,
        user: string,
        created: string
    }
    
    const [notesList, setNotesList] = useState<Note[]>([]);
    const defaultParams = {
        id: '',
        tags: '',
        title: '',
        description: ''
    };
    //const [params, setParams] = useState<any>(JSON.parse(JSON.stringify(defaultParams)));
    const [params, setParams] = useState<Note>(defaultParams);
    const [noteUpdateModal, setNoteUpdateModal] = useState(false);
    const [isShowNoteMenu, setIsShowNoteMenu] = useState(false);
    const [isViewNoteModal, setIsViewNoteModal] = useState(false);
    const [filterdNotesList, setFilterdNotesList] = useState<Note[]>([]);
    const [filterTags, setFilterTags] = useState('');

    const searchNotes = () => {
        if (filterTags) {
            setFilterdNotesList(notesList.filter((item) => item.tags === filterTags));
        } else {
            setFilterdNotesList(notesList);
        }
    };

    const saveNote = () => {
        if (!params.title) {
            showMessage('제목을 입력해 주십시오.', 'error');
            return false;
        }

        showMessage('Note has been saved successfully.');
        setNoteUpdateModal(false);
        setFilterTags('');
        searchNotes();
    };

    const tabChanged = (tags: string) => {
        setFilterTags(tags);
        setIsShowNoteMenu(false);
        searchNotes();
    };

    const changeValue = (e: any) => {
        const { value, id } = e.target;
        setParams({ ...params, [id]: value });
    };

    const viewNote = (note: any) => {
        setParams(note);
        setIsViewNoteModal(true);
    };

    const editNote = (note: any = null) => {
        setIsShowNoteMenu(false);
        const json = JSON.parse(JSON.stringify(defaultParams));
        setParams(json);
        if (note) {
            let json1 = JSON.parse(JSON.stringify(note));
            setParams(json1);
        }
        setNoteUpdateModal(true);
    };
    
    useEffect(() => {
        searchNotes();
    }, [filterTags, notesList]);

    const showMessage = (msg = '', type = 'success') => {
        const toast: any = Swal.mixin({
            toast: true,
            position: isRtl ? 'top-start' : 'top-end',
            showConfirmButton: false,
            showCloseButton: true,
            timer: 3000,
            customClass: { container: 'toast' },
        });
        toast.fire({
            icon: type,
            title: msg,
            padding: '10px 20px',
        });
    };

    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl' ? true : false;

    interface Tag {
        id: string,
        color: string,
        title: string
    }

    let tagTitleRef = useRef(null);
    const [tagsModal, setTagsModal] = useState(false);
    const [tagAdding, setTagAdding] = useState(false);
    const [tagColor, setTagColor] = useState('');
    const [tagTitle, setTagTitle] = useState('');
    useEffect(() => {
        if (tagsModal === false) {
            tagsLoad();
        }
    }, [tagsModal]);
    const tagColorChange = (event: any) => {
        const value = event.currentTarget.value;
        setTagColor(value);
        //console.log(value);
    };
    const tagTitleChange = (event: any) => {
        const value = event.currentTarget.value;
        setTagTitle(value);
        //console.log(value);
    };
    const tagAdd = async (event: any) => {
        event.preventDefault();

        setTagAdding(true);
        const seq = tagsList.length;
        const axiosData = { module: 'tagAdd', category: 'note', user: 'TEST', color: tagColor, title: tagTitle, seq: seq };
        const result = await axios.post('/api/tags', axiosData);
        //console.log(result.data);
        //affectedRows: 1, fieldCount: 0, info: "", insertId: 1, serverStatus: 2, warningStatus: 0

        if (result.data.affectedRows) {
            setTagColor('');
            setTagTitle('');
            showMessage('정상적으로 저장하였습니다.');
            setTagAdding(false);
            tagsLoad();
        } else {
            showMessage('데이터를 저장하지 못했습니다.', 'error');
            setTagAdding(false);
        }
    };
    const tagUpdate = async (event: any) => {
        const id = event.currentTarget.dataset.id;
        const index = tagsList.findIndex(tag => tag.id === id);
        const tagColor = tagsList[index].color;
        const tagTitle = tagsList[index].title;

        const axiosData = { module: 'tagUpdate', id: id, color: tagColor, title: tagTitle };
        const result = await axios.post('/api/tags', axiosData);
        //console.log(result.data);

        if (result.data.affectedRows) {
            showMessage('정상적으로 저장하였습니다.');
            tagsLoad();
        } else {
            showMessage('데이터를 저장하지 못했습니다.', 'error');
        }
    };
    const tagDelete = async (event: any) => {
        const id = event.currentTarget.dataset.id;

        Swal.fire({
            title: '정말 삭제 하시겠습니까?',
            text: '삭제된 데이터는 복구가 불가능합니다.',
            icon: 'error',//sucess, error, warning, info, question
            showCancelButton: true,
            confirmButtonColor: '#e7515a',
            confirmButtonText: '삭제',
            cancelButtonText: '취소',
        }).then(async result => {
            if (result.isConfirmed) {
                const axiosData = { module: 'tagDelete', id: id };
                const result = await axios.post('/api/tags', axiosData);
                //console.log(result.data);

                if (result.data.affectedRows) {
                    showMessage('정상적으로 삭제하였습니다.');
                    tagsLoad();
                } else {
                    showMessage('데이터를 삭제하지 못했습니다.', 'error');
                }
            }
        });
    };

    const [tagsList, setTagsList] = useState<Tag[]>([]);
    const truncateTags = async () => {
        Swal.fire({
            title: '정말 초기화 하시겠습니까?',
            text: '초기화된 데이터는 복구가 불가능합니다.',
            icon: 'error',//sucess, error, warning, info, question
            showCancelButton: true,
            confirmButtonColor: '#e7515a',
            confirmButtonText: '초기화',
            cancelButtonText: '취소',
        }).then(async result => {
            if (result.isConfirmed) {
                const axiosData = { module: 'truncateTags' };
                const result = await axios.post('/api/tags', axiosData);
                console.log(result.data);

                let errorCount = 0;
                //console.log(result.data);

                result.data.map((item: any) => {
                    if (item.warningStatus) {
                        errorCount++;
                    }
                });

                if (errorCount) {
                    showMessage(`초기화 쿼리 중 ${errorCount} 건 실패했습니다.`, 'error');//sucess, error, warning, info, question
                } else {
                    showMessage(`정상적으로 초기화 하였습니다.`, 'sucess');//sucess, error, warning, info, question
                }

                tagsLoad();
            }
        });
    };
    const tagsLoad = async () => {
        const axiosData = { module: 'tagsLoad', category: 'note', user: 'TEST' };
        const result = await axios.post('/api/tags', axiosData);
        setTagsList(result.data);
        console.log(result.data);
    };
    const tagColorChange2 = (id: string, event: any) => {
        let cloneTagList = [...tagsList];
        const value = event.currentTarget.value;
        const index = cloneTagList.findIndex(tag => tag.id === id);
        //console.log(id, value, index);

        cloneTagList[index].color = value;
        setTagsList(cloneTagList);
        //console.log(cloneTagList);
    };
    const tagTitleChange2 = (id: string, event: any) => {
        let cloneTagList = [...tagsList];
        const value = event.currentTarget.value;
        const index = cloneTagList.findIndex(tag => tag.id === id);
        //console.log(id, value, index);

        cloneTagList[index].title = value;
        setTagsList(cloneTagList);
        //console.log(cloneTagList);
    };
    const tagsSort = async (event: any) => {
        const obj = Array.from(event.to.children);
        let tagsIdList: string[] = [];
        
        obj.map((item: any) => {
            tagsIdList.push(item.dataset.id);
        });

        //console.log(tagsIdList);

        const axiosData = { module: 'tagsSort', tagsIdList: tagsIdList };
        const result = await axios.post('/api/tags', axiosData);
        let errorCount = 0;
        //console.log(result.data);

        result.data.map((item: any) => {
            if (!item.affectedRows) {
                errorCount++;
            }
        });

        if (errorCount) {
            showMessage(`데이터를 ${errorCount} 건 저장하지 못했습니다.`, 'error');//sucess, error, warning, info, question
        }
    };

    

    let noteTitleRef = useRef(null);
    const [noteModal, setNoteModal] = useState(false);
    const [noteUpdating, setNoteUpdating] = useState(false);
    const [noteTag, setNoteTag] = useState('');
    const [noteTitle, setNoteTitle] = useState('');
    const [description, setDescription] = useState('');
    /*useEffect(() => {
        if (tagsModal === false) {
            notesLoad();
        }
    }, [noteModal]);*/
    const truncateNotes = async () => {
        Swal.fire({
            title: '정말 초기화 하시겠습니까?',
            text: '초기화된 데이터는 복구가 불가능합니다.',
            icon: 'error',//sucess, error, warning, info, question
            showCancelButton: true,
            confirmButtonColor: '#e7515a',
            confirmButtonText: '초기화',
            cancelButtonText: '취소',
        }).then(async result => {
            if (result.isConfirmed) {
                const axiosData = { module: 'truncateNotes' };
                const result = await axios.post('/api/notes', axiosData);
                console.log(result.data);

                let errorCount = 0;
                //console.log(result.data);

                result.data.map((item: any) => {
                    if (item.warningStatus) {
                        errorCount++;
                    }
                });

                if (errorCount) {
                    showMessage(`초기화 쿼리 중 ${errorCount} 건 실패했습니다.`, 'error');//sucess, error, warning, info, question
                } else {
                    showMessage(`정상적으로 초기화 하였습니다.`, 'sucess');//sucess, error, warning, info, question
                }
            }
        });
    };
    /*const noteTagChange = (event: any) => {
        const value = event.currentTarget.value;
        setNoteTag(value);
        //console.log(value);
    };
    const noteTitleChange = (event: any) => {
        const value = event.currentTarget.value;
        setNoteTitle(value);
        //console.log(value);
    };*/
    const noteUpdate = async (event: any) => {
        event.preventDefault();

        /*setNoteUpdate(true);
        const seq = tagsList.length;
        const axiosData = { module: 'tagAdd', category: 'note', user: 'TEST', color: tagColor, title: tagTitle, seq: seq };
        const result = await axios.post('/api/notes', axiosData);
        //console.log(result.data);
        //affectedRows: 1, fieldCount: 0, info: "", insertId: 1, serverStatus: 2, warningStatus: 0

        if (result.data.affectedRows) {
            setNoteTag('');
            setNoteTitle('');
            showMessage('정상적으로 저장하였습니다.');
            setNoteAdding(false);
            notesLoad();
        } else {
            showMessage('데이터를 저장하지 못했습니다.', 'error');
            setNoteAdding(false);
        }*/
    };
    /*const noteUpdate = async (event: any) => {
        const id = event.currentTarget.dataset.id;
        const index = tagsList.findIndex(tag => tag.id === id);
        const tagColor = tagsList[index].color;
        const tagTitle = tagsList[index].title;

        const axiosData = { module: 'tagUpdate', id: id, color: tagColor, title: tagTitle };
        const result = await axios.post('/api/notes', axiosData);
        //console.log(result.data);

        if (result.data.affectedRows) {
            showMessage('정상적으로 저장하였습니다.');
            tagsLoad();
        } else {
            showMessage('데이터를 저장하지 못했습니다.', 'error');
        }
    };
    const noteDelete = async (event: any) => {
        const id = event.currentTarget.dataset.id;

        Swal.fire({
            title: '정말 삭제 하시겠습니까?',
            text: '삭제된 데이터는 복구가 불가능합니다.',
            icon: 'error',//sucess, error, warning, info, question
            showCancelButton: true,
            confirmButtonColor: '#e7515a',
            confirmButtonText: '삭제',
            cancelButtonText: '취소',
        }).then(async result => {
            if (result.isConfirmed) {
                const axiosData = { module: 'notegDelete', id: id };
                const result = await axios.post('/api/notes', axiosData);
                //console.log(result.data);

                if (result.data.affectedRows) {
                    showMessage('정상적으로 삭제하였습니다.');
                    tagsLoad();
                } else {
                    showMessage('데이터를 삭제하지 못했습니다.', 'error');
                }
            }
        });
    };

    const [notesList, setNotesList] = useState<Note[]>([]);
    const notesLoad = async () => {
        const axiosData = { module: 'notesLoad', user: 'TEST' };
        const result = await axios.post('/api/notes', axiosData);
        setNotesList(result.data);
        console.log(result.data);
    };*/

    return (
        <div>
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
                            <h3 className="text-lg font-semibold ltr:ml-3 rtl:mr-3">Notes</h3>
                        </div>

                        <div className="my-4 h-px w-full border-b border-white-light dark:border-[#1b2e4b] mb-3"></div>

                        <PerfectScrollbar className="relative -mr-3.5 h-full grow pr-3.5">
                            <div className="px-1 py-3 text-white-dark">
                                <div className="flex justify-between">
                                    <div>Tags</div>
                                    <div>
                                        <button type="button" onClick={() => setTagsModal(true)}>
                                            <BsGear />
                                        </button>
                                    </div>
                                </div>
                                <Transition appear show={tagsModal} as={Fragment}>
                                    <Dialog as="div" open={tagsModal} initialFocus={tagTitleRef} onClose={() => setTagsModal(true)}>
                                        <Transition.Child
                                            as={Fragment}
                                            enter="ease-out duration-300"
                                            enterFrom="opacity-0"
                                            enterTo="opacity-100"
                                            leave="ease-in duration-200"
                                            leaveFrom="opacity-100"
                                            leaveTo="opacity-0"
                                        >
                                            <div className="fixed inset-0" />
                                        </Transition.Child>
                                        <div className="fixed inset-0 bg-[black]/60 z-[999] overflow-y-auto">
                                            <div className="flex items-center justify-center min-h-screen px-4">
                                                <Transition.Child
                                                    as={Fragment}
                                                    enter="ease-out duration-300"
                                                    enterFrom="opacity-0 scale-95"
                                                    enterTo="opacity-100 scale-100"
                                                    leave="ease-in duration-200"
                                                    leaveFrom="opacity-100 scale-100"
                                                    leaveTo="opacity-0 scale-95"
                                                >
                                                    <Dialog.Panel as="div" className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg my-8 text-black dark:text-white-dark">
                                                        <div className="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                                                            <div className="font-bold text-lg">Tags Setting</div>
                                                            <button type="button" onClick={() => setTagsModal(false)} className="text-white-dark hover:text-dark">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                                </svg>
                                                            </button>
                                                        </div>
                                                        <div className="px-5 pb-5">
                                                            <div>
                                                                <form onSubmit={tagAdd}>
                                                                    <div className="flex">
                                                                        <select value={tagColor} onChange={tagColorChange} className="form-select text-white-dark ltr:rounded-r-none rtl:rounded-l-none" required>
                                                                            <option value="">Color</option>
                                                                            <option value="primary" className="bg-primary text-white">Primary</option>
                                                                            <option value="info" className="bg-info text-white">Info</option>
                                                                            <option value="success" className="bg-success text-white">Success</option>
                                                                            <option value="warning" className="bg-warning text-white">Warning</option>
                                                                            <option value="danger" className="bg-danger text-white">Danger</option>
                                                                        </select>
                                                                        <input type="text" ref={tagTitleRef} value={tagTitle} onChange={tagTitleChange} placeholder="Tag" minLength={2} className="form-input ltr:rounded-r-none rtl:rounded-l-none ltr:rounded-l-none rtl:rounded-r-none" required />
                                                                        <button type="submit" className="btn btn-primary ltr:rounded-l-none rtl:rounded-r-none">
                                                                            {tagAdding === false ? <BsPlus /> : <FiLoader className="animate-ping" />}
                                                                        </button>
                                                                    </div>
                                                                </form>
                                                            </div>
                                                            <div className="my-5">
                                                                <ul>
                                                                    <ReactSortable list={tagsList} setList={setTagsList} onChange={tagsSort} animation={200} handle=".handle" group="handler" ghostClass="gu-transit">
                                                                        {tagsList.map((item: any, index) => {
                                                                            return (
                                                                                <li key={item.id} className="mb-2.5">
                                                                                    <div className="flex">
                                                                                        <select value={item.color} onChange={(event) => tagColorChange2(item.id, event)} className="form-select text-white-dark ltr:rounded-r-none rtl:rounded-l-none" required>
                                                                                            <option value="" disabled>Color</option>
                                                                                            <option value="primary" className="bg-primary text-white">Primary</option>
                                                                                            <option value="info" className="bg-info text-white">Info</option>
                                                                                            <option value="success" className="bg-success text-white">Success</option>
                                                                                            <option value="warning" className="bg-warning text-white">Warning</option>
                                                                                            <option value="danger" className="bg-danger text-white">Danger</option>
                                                                                        </select>
                                                                                        <input type="text" value={item.title} onChange={(event) => tagTitleChange2(item.id, event)} placeholder="Tag" minLength={3} className="form-input ltr:rounded-r-none rtl:rounded-l-none ltr:rounded-l-none rtl:rounded-r-none" required />
                                                                                        <button type="button" onClick={tagUpdate} data-id={item.id} className="btn btn-primary rounded-l-none rounded-r-none">
                                                                                            <BsCheckLg />
                                                                                        </button>
                                                                                        <button type="button" onClick={tagDelete} data-id={item.id} className="btn btn-danger rounded-l-none rounded-r-none">
                                                                                            <BsTrash />
                                                                                        </button>
                                                                                        <button type="button" className="handle cursor-move btn btn-dark ltr:rounded-l-none rtl:rounded-r-none">
                                                                                            <BsArrowDownUp />
                                                                                        </button>
                                                                                    </div>
                                                                                </li>
                                                                            );
                                                                        })}
                                                                    </ReactSortable>
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </Dialog.Panel>
                                                </Transition.Child>
                                            </div>
                                        </div>
                                    </Dialog>
                                </Transition>
                            </div>

                            <button type="button" className="flex h-10 w-full items-center rounded-md p-1 font-medium duration-300 hover:bg-white-dark/10 ltr:hover:pl-3 rtl:hover:pr-3 dark:hover:bg-[#181F32]" onClick={() => setFilterTags('')}>
                                <BsCheck2All />
                                <div className="ltr:ml-3 rtl:mr-3"><strong>ALL NOTES</strong></div>
                            </button>

                            {tagsList.map((item: any) => {
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        className=
                                        {`flex h-10 w-full items-center rounded-md p-1 font-medium text-${item.color} duration-300 hover:bg-white-dark/10 ltr:hover:pl-3 rtl:hover:pr-3 dark:hover:bg-[#181F32] ${
                                            filterTags === '${item.title}' && 'bg-gray-100 ltr:pl-3 rtl:pr-3 dark:bg-[#181F32]'
                                        }`}
                                        onClick={() => tabChanged(`${item.title}`)}
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 rotate-45 fill-${item.color}`}>
                                            <path
                                                d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12Z"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                            ></path>
                                        </svg>
                                        <div className="ltr:ml-3 rtl:mr-3">{item.title}</div>
                                    </button>
                                );
                            })}
                        </PerfectScrollbar>
                    </div>
                    <div className="absolute bottom-0 w-full p-4 ltr:left-0 rtl:right-0">
                        <button className="btn btn-danger w-full mb-5" type="button" onClick={truncateTags}>
                            <BsTrash className="ltr:mr-2 rtl:ml-2" /> Truncate Tags
                        </button>
                        <button className="btn btn-danger w-full mb-5" type="button" onClick={truncateNotes}>
                            <BsTrash className="ltr:mr-2 rtl:ml-2" /> Truncate Notes
                        </button>
                        <button className="btn btn-primary w-full" type="button" onClick={() => editNote()}>
                            <svg className="h-5 w-5 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Add New Note
                        </button>
                    </div>
                </div>
                <div className="panel h-full flex-1 overflow-auto">
                    <div className="pb-5">
                        <button type="button" className="hover:text-primary xl:hidden" onClick={() => setIsShowNoteMenu(!isShowNoteMenu)}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 7L4 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                <path opacity="0.5" d="M20 12L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M20 17L4 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                    {filterdNotesList.length ? (
                        <div className="min-h-[400px] sm:min-h-[300px]">
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                                {filterdNotesList.map((note: any) => {
                                    return (
                                        <div
                                            className={`panel pb-12 ${
                                                note.tag === 'personal'
                                                    ? 'bg-primary-light shadow-primary'
                                                    : note.tag === 'work'
                                                    ? 'bg-warning-light shadow-warning'
                                                    : note.tag === 'social'
                                                    ? 'bg-info-light shadow-info'
                                                    : note.tag === 'important'
                                                    ? 'bg-danger-light shadow-danger'
                                                    : 'dark:shadow-dark'
                                            }`}
                                            key={note.id}
                                        >
                                            <div className="min-h-[142px]">
                                                <div className="flex justify-between">
                                                    <div className="flex w-max items-center">
                                                        <div className="flex-none">
                                                            {note.thumb && (
                                                                <div className="rounded-full bg-gray-300 p-0.5 dark:bg-gray-700">
                                                                    <img className="h-8 w-8 rounded-full object-cover" alt="img" src={`/assets/images/${note.thumb}`} />
                                                                </div>
                                                            )}

                                                            {!note.thumb && note.user && (
                                                                <div className="grid h-8 w-8 place-content-center rounded-full bg-gray-300 text-sm font-semibold dark:bg-gray-700">
                                                                    {note.user.charAt(0) + '' + note.user.charAt(note.user.indexOf('') + 1)}
                                                                </div>
                                                            )}
                                                            {!note.thumb && !note.user && (
                                                                <div className="rounded-full bg-gray-300 p-2 dark:bg-gray-700">
                                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                        <circle cx="12" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" />
                                                                        <ellipse opacity="0.5" cx="12" cy="17" rx="7" ry="4" stroke="currentColor" strokeWidth="1.5" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="ltr:ml-2 rtl:mr-2">
                                                            <div className="font-semibold">{note.user}</div>
                                                            <div className="text-sx text-white-dark">{note.date}</div>
                                                        </div>
                                                    </div>
                                                    <div className="dropdown">
                                                        <Dropdown
                                                            offset={[0, 5]}
                                                            placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                                                            btnClassName="text-primary"
                                                            button={
                                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="rotate-90 opacity-70">
                                                                    <circle cx="5" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
                                                                    <circle opacity="0.5" cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
                                                                    <circle cx="19" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
                                                                </svg>
                                                            }
                                                        >
                                                            <ul className="text-sm font-medium">
                                                                <li>
                                                                    <button type="button" onClick={() => editNote(note)}>
                                                                        <svg
                                                                            width="24"
                                                                            height="24"
                                                                            viewBox="0 0 24 24"
                                                                            fill="none"
                                                                            xmlns="http://www.w3.org/2000/svg"
                                                                            className="h-4 w-4 ltr:mr-3 rtl:ml-3"
                                                                        >
                                                                            <path
                                                                                d="M15.2869 3.15178L14.3601 4.07866L5.83882 12.5999L5.83881 12.5999C5.26166 13.1771 4.97308 13.4656 4.7249 13.7838C4.43213 14.1592 4.18114 14.5653 3.97634 14.995C3.80273 15.3593 3.67368 15.7465 3.41556 16.5208L2.32181 19.8021L2.05445 20.6042C1.92743 20.9852 2.0266 21.4053 2.31063 21.6894C2.59466 21.9734 3.01478 22.0726 3.39584 21.9456L4.19792 21.6782L7.47918 20.5844L7.47919 20.5844C8.25353 20.3263 8.6407 20.1973 9.00498 20.0237C9.43469 19.8189 9.84082 19.5679 10.2162 19.2751C10.5344 19.0269 10.8229 18.7383 11.4001 18.1612L11.4001 18.1612L19.9213 9.63993L20.8482 8.71306C22.3839 7.17735 22.3839 4.68748 20.8482 3.15178C19.3125 1.61607 16.8226 1.61607 15.2869 3.15178Z"
                                                                                stroke="currentColor"
                                                                                strokeWidth="1.5"
                                                                            />
                                                                            <path
                                                                                opacity="0.5"
                                                                                d="M14.36 4.07812C14.36 4.07812 14.4759 6.04774 16.2138 7.78564C17.9517 9.52354 19.9213 9.6394 19.9213 9.6394M4.19789 21.6777L2.32178 19.8015"
                                                                                stroke="currentColor"
                                                                                strokeWidth="1.5"
                                                                            />
                                                                        </svg>
                                                                        Edit
                                                                    </button>
                                                                </li>
                                                                <li>
                                                                    <button type="button" /*onClick={() => deleteNoteConfirm(note)}*/>
                                                                        <svg className="ltr:mr-3 rtl:ml-3" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                            <path
                                                                                opacity="0.5"
                                                                                d="M9.17065 4C9.58249 2.83481 10.6937 2 11.9999 2C13.3062 2 14.4174 2.83481 14.8292 4"
                                                                                stroke="currentColor"
                                                                                strokeWidth="1.5"
                                                                                strokeLinecap="round"
                                                                            />
                                                                            <path d="M20.5001 6H3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                                            <path
                                                                                d="M18.8334 8.5L18.3735 15.3991C18.1965 18.054 18.108 19.3815 17.243 20.1907C16.378 21 15.0476 21 12.3868 21H11.6134C8.9526 21 7.6222 21 6.75719 20.1907C5.89218 19.3815 5.80368 18.054 5.62669 15.3991L5.16675 8.5"
                                                                                stroke="currentColor"
                                                                                strokeWidth="1.5"
                                                                                strokeLinecap="round"
                                                                            />
                                                                            <path opacity="0.5" d="M9.5 11L10 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                                            <path opacity="0.5" d="M14.5 11L14 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                                        </svg>
                                                                        Delete
                                                                    </button>
                                                                </li>
                                                                <li>
                                                                    <button type="button" onClick={() => viewNote(note)}>
                                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ltr:mr-3 rtl:ml-3">
                                                                            <path
                                                                                opacity="0.5"
                                                                                d="M3.27489 15.2957C2.42496 14.1915 2 13.6394 2 12C2 10.3606 2.42496 9.80853 3.27489 8.70433C4.97196 6.49956 7.81811 4 12 4C16.1819 4 19.028 6.49956 20.7251 8.70433C21.575 9.80853 22 10.3606 22 12C22 13.6394 21.575 14.1915 20.7251 15.2957C19.028 17.5004 16.1819 20 12 20C7.81811 20 4.97196 17.5004 3.27489 15.2957Z"
                                                                                stroke="currentColor"
                                                                                strokeWidth="1.5"
                                                                            />
                                                                            <path
                                                                                d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z"
                                                                                stroke="currentColor"
                                                                                strokeWidth="1.5"
                                                                            />
                                                                        </svg>
                                                                        View
                                                                    </button>
                                                                </li>
                                                            </ul>
                                                        </Dropdown>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="mt-4 font-semibold">{note.title}</h4>
                                                    <div className="mt-2 text-white-dark">{note.description}</div>
                                                </div>
                                            </div>
                                            <div className="absolute bottom-5 left-0 w-full px-5">
                                                <div className="mt-2 flex items-center justify-between">
                                                    <div className="dropdown">
                                                        <div className="dropdown">
                                                            <Dropdown
                                                                offset={[0, 5]}
                                                                placement={`${isRtl ? 'bottom-end' : 'bottom-start'}`}
                                                                btnClassName={`text-${note.tags}`}
                                                                button={
                                                                    <span>
                                                                        <svg
                                                                            width="24"
                                                                            height="24"
                                                                            viewBox="0 0 24 24"
                                                                            fill="none"
                                                                            xmlns="http://www.w3.org/2000/svg"
                                                                            className={`h-3 w-3 rotate-45 fill-${note.tags}`}
                                                                        >
                                                                            <path
                                                                                d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12Z"
                                                                                stroke="currentColor"
                                                                                strokeWidth="1.5"
                                                                            ></path>
                                                                        </svg>
                                                                    </span>
                                                                }
                                                            >
                                                                <ul className="text-sm font-medium">
                                                                    <li>
                                                                        <button type="button" onClick={() => setTag(note, 'personal')}>
                                                                            <svg
                                                                                width="24"
                                                                                height="24"
                                                                                viewBox="0 0 24 24"
                                                                                fill="none"
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                className="h-3 w-3 rotate-45 fill-primary ltr:mr-2 rtl:ml-2"
                                                                            >
                                                                                <path
                                                                                    d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12Z"
                                                                                    stroke="none"
                                                                                    strokeWidth="1.5"
                                                                                ></path>
                                                                            </svg>
                                                                            Personal
                                                                        </button>
                                                                    </li>
                                                                    <li>
                                                                        <button type="button" onClick={() => setTag(note, 'work')}>
                                                                            <svg
                                                                                width="24"
                                                                                height="24"
                                                                                viewBox="0 0 24 24"
                                                                                fill="none"
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                className="h-3 w-3 rotate-45 fill-warning ltr:mr-2 rtl:ml-2"
                                                                            >
                                                                                <path
                                                                                    d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12Z"
                                                                                    stroke="none"
                                                                                    strokeWidth="1.5"
                                                                                ></path>
                                                                            </svg>
                                                                            Work
                                                                        </button>
                                                                    </li>
                                                                    <li>
                                                                        <button type="button" onClick={() => setTag(note, 'social')}>
                                                                            <svg
                                                                                width="24"
                                                                                height="24"
                                                                                viewBox="0 0 24 24"
                                                                                fill="none"
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                className="h-3 w-3 rotate-45 fill-info ltr:mr-2 rtl:ml-2"
                                                                            >
                                                                                <path
                                                                                    d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12Z"
                                                                                    stroke="none"
                                                                                    strokeWidth="1.5"
                                                                                ></path>
                                                                            </svg>
                                                                            Social
                                                                        </button>
                                                                    </li>
                                                                    <li>
                                                                        <button type="button" onClick={() => setTag(note, 'important')}>
                                                                            <svg
                                                                                width="24"
                                                                                height="24"
                                                                                viewBox="0 0 24 24"
                                                                                fill="none"
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                className="h-3 w-3 rotate-45 fill-danger ltr:mr-2 rtl:ml-2"
                                                                            >
                                                                                <path
                                                                                    d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12Z"
                                                                                    stroke="none"
                                                                                    strokeWidth="1.5"
                                                                                ></path>
                                                                            </svg>
                                                                            Important
                                                                        </button>
                                                                    </li>
                                                                </ul>
                                                            </Dropdown>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <button type="button" className="text-danger" /*onClick={() => deleteNoteConfirm(note)}*/>
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path
                                                                    opacity="0.5"
                                                                    d="M9.17065 4C9.58249 2.83481 10.6937 2 11.9999 2C13.3062 2 14.4174 2.83481 14.8292 4"
                                                                    stroke="currentColor"
                                                                    strokeWidth="1.5"
                                                                    strokeLinecap="round"
                                                                />
                                                                <path d="M20.5001 6H3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                                <path
                                                                    d="M18.8334 8.5L18.3735 15.3991C18.1965 18.054 18.108 19.3815 17.243 20.1907C16.378 21 15.0476 21 12.3868 21H11.6134C8.9526 21 7.6222 21 6.75719 20.1907C5.89218 19.3815 5.80368 18.054 5.62669 15.3991L5.16675 8.5"
                                                                    stroke="currentColor"
                                                                    strokeWidth="1.5"
                                                                    strokeLinecap="round"
                                                                />
                                                                <path opacity="0.5" d="M9.5 11L10 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                                <path opacity="0.5" d="M14.5 11L14 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-full min-h-[400px] items-center justify-center text-lg font-semibold sm:min-h-[300px]">No data available</div>
                    )}

                    <Transition appear show={noteUpdateModal} as={Fragment}>
                        <Dialog as="div" open={noteUpdateModal} onClose={() => setNoteUpdateModal(false)} className="relative z-50">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0"
                                enterTo="opacity-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                            >
                                <div className="fixed inset-0 bg-[black]/60" />
                            </Transition.Child>

                            <div className="fixed inset-0 overflow-y-auto">
                                <div className="flex min-h-full items-center justify-center px-4 py-8">
                                    <Transition.Child
                                        as={Fragment}
                                        enter="ease-out duration-300"
                                        enterFrom="opacity-0 scale-95"
                                        enterTo="opacity-100 scale-100"
                                        leave="ease-in duration-200"
                                        leaveFrom="opacity-100 scale-100"
                                        leaveTo="opacity-0 scale-95"
                                    >
                                        <Dialog.Panel className="panel w-full max-w-lg overflow-hidden rounded-lg border-0 p-0 text-black dark:text-white-dark">
                                            <button
                                                type="button"
                                                onClick={() => setNoteUpdateModal(false)}
                                                className="absolute top-4 text-gray-400 outline-none hover:text-gray-800 ltr:right-4 rtl:left-4 dark:hover:text-gray-600"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="24"
                                                    height="24"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                </svg>
                                            </button>
                                            <div className="bg-[#fbfbfb] py-3 text-lg font-medium ltr:pl-5 ltr:pr-[50px] rtl:pr-5 rtl:pl-[50px] dark:bg-[#121c2c]">
                                                {params.id ? 'Edit Note' : 'Add Note'}
                                            </div>
                                            <div className="p-5">
                                                <form onSubmit={noteUpdate}>
                                                    <div className="mb-5">
                                                        <label htmlFor="title">Title</label>
                                                        <input id="title" type="text" placeholder="Enter Title" className="form-input" value={params.title} onChange={(e) => changeValue(e)} />
                                                    </div>
                                                    <div className="mb-5">
                                                        <label htmlFor="name">User Name</label>
                                                        <select id="user" className="form-select" value={params.user} onChange={(e) => changeValue(e)}>
                                                            <option value="">Select User</option>
                                                            <option value="Max Smith">Max Smith</option>
                                                            <option value="John Doe">John Doe</option>
                                                            <option value="Kia Jain">Kia Jain</option>
                                                            <option value="Karena Courtliff">Karena Courtliff</option>
                                                            <option value="Vladamir Koschek">Vladamir Koschek</option>
                                                            <option value="Robert Garcia">Robert Garcia</option>
                                                            <option value="Marie Hamilton">Marie Hamilton</option>
                                                            <option value="Megan Meyers">Megan Meyers</option>
                                                            <option value="Angela Hull">Angela Hull</option>
                                                            <option value="Karen Wolf">Karen Wolf</option>
                                                            <option value="Jasmine Barnes">Jasmine Barnes</option>
                                                            <option value="Thomas Cox">Thomas Cox</option>
                                                            <option value="Marcus Jones">Marcus Jones</option>
                                                            <option value="Matthew Gray">Matthew Gray</option>
                                                            <option value="Chad Davis">Chad Davis</option>
                                                            <option value="Linda Drake">Linda Drake</option>
                                                            <option value="Kathleen Flores">Kathleen Flores</option>
                                                        </select>
                                                    </div>
                                                    <div className="mb-5">
                                                        <label htmlFor="tag">Tag</label>
                                                        <select id="tag" className="form-select" value={params.tag} onChange={(e) => changeValue(e)}>
                                                            <option value="">None</option>
                                                            <option value="personal">Personal</option>
                                                            <option value="work">Work</option>
                                                            <option value="social">Social</option>
                                                            <option value="important">Important</option>
                                                        </select>
                                                    </div>
                                                    <div className="mb-5">
                                                        <label htmlFor="desc">Description</label>
                                                        {/*<textarea
                                                            id="description"
                                                            rows={3}
                                                            className="form-textarea min-h-[130px] resize-none"
                                                            placeholder="Enter Description"
                                                            value={params.description}
                                                            onChange={(e) => changeValue(e)}
                                                        ></textarea>*/}
                                                        <ReactQuill theme="snow" value={description} onChange={setDescription} />
                                                    </div>
                                                    <div className="mt-8 flex items-center justify-end">
                                                        <button type="button" className="btn btn-outline-danger gap-2" onClick={() => setNoteUpdateModal(false)}>
                                                            Cancel
                                                        </button>
                                                        <button type="button" className="btn btn-primary ltr:ml-4 rtl:mr-4" onClick={saveNote}>
                                                            {params.id ? 'Update Note' : 'Add Note'}
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        </Dialog.Panel>
                                    </Transition.Child>
                                </div>
                            </div>
                        </Dialog>
                    </Transition>

                    <Transition appear show={isViewNoteModal} as={Fragment}>
                        <Dialog as="div" open={isViewNoteModal} onClose={() => setIsViewNoteModal(false)} className="relative z-50">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0"
                                enterTo="opacity-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                            >
                                <div className="fixed inset-0 bg-[black]/60" />
                            </Transition.Child>

                            <div className="fixed inset-0 overflow-y-auto">
                                <div className="flex min-h-full items-center justify-center px-4 py-8">
                                    <Transition.Child
                                        as={Fragment}
                                        enter="ease-out duration-300"
                                        enterFrom="opacity-0 scale-95"
                                        enterTo="opacity-100 scale-100"
                                        leave="ease-in duration-200"
                                        leaveFrom="opacity-100 scale-100"
                                        leaveTo="opacity-0 scale-95"
                                    >
                                        <Dialog.Panel className="panel w-full max-w-lg overflow-hidden rounded-lg border-0 p-0 text-black dark:text-white-dark">
                                            <button
                                                type="button"
                                                onClick={() => setIsViewNoteModal(false)}
                                                className="absolute top-4 text-gray-400 outline-none hover:text-gray-800 ltr:right-4 rtl:left-4 dark:hover:text-gray-600"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="24"
                                                    height="24"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                </svg>
                                            </button>
                                            <div className="flex flex-wrap items-center gap-2 bg-[#fbfbfb] py-3 text-lg font-medium ltr:pl-5 ltr:pr-[50px] rtl:pr-5 rtl:pl-[50px] dark:bg-[#121c2c]">
                                                <div className="ltr:mr-3 rtl:ml-3">{params.title}</div>
                                                {params.tag && (
                                                    <button
                                                        type="button"
                                                        className={`badge badge-outline-primary rounded-3xl capitalize ltr:mr-3 rtl:ml-3 ${
                                                            (params.tag === 'personal' && 'shadow-primary',
                                                            params.tag === 'work' && 'shadow-warning',
                                                            params.tag === 'social' && 'shadow-info',
                                                            params.tag === 'important' && 'shadow-danger')
                                                        }`}
                                                    >
                                                        {params.tag}
                                                    </button>
                                                )}
                                                {params.isFav && (
                                                    <button type="button" className="text-warning">
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="fill-warning">
                                                            <path
                                                                d="M9.15316 5.40838C10.4198 3.13613 11.0531 2 12 2C12.9469 2 13.5802 3.13612 14.8468 5.40837L15.1745 5.99623C15.5345 6.64193 15.7144 6.96479 15.9951 7.17781C16.2757 7.39083 16.6251 7.4699 17.3241 7.62805L17.9605 7.77203C20.4201 8.32856 21.65 8.60682 21.9426 9.54773C22.2352 10.4886 21.3968 11.4691 19.7199 13.4299L19.2861 13.9372C18.8096 14.4944 18.5713 14.773 18.4641 15.1177C18.357 15.4624 18.393 15.8341 18.465 16.5776L18.5306 17.2544C18.7841 19.8706 18.9109 21.1787 18.1449 21.7602C17.3788 22.3417 16.2273 21.8115 13.9243 20.7512L13.3285 20.4768C12.6741 20.1755 12.3469 20.0248 12 20.0248C11.6531 20.0248 11.3259 20.1755 10.6715 20.4768L10.0757 20.7512C7.77268 21.8115 6.62118 22.3417 5.85515 21.7602C5.08912 21.1787 5.21588 19.8706 5.4694 17.2544L5.53498 16.5776C5.60703 15.8341 5.64305 15.4624 5.53586 15.1177C5.42868 14.773 5.19043 14.4944 4.71392 13.9372L4.2801 13.4299C2.60325 11.4691 1.76482 10.4886 2.05742 9.54773C2.35002 8.60682 3.57986 8.32856 6.03954 7.77203L6.67589 7.62805C7.37485 7.4699 7.72433 7.39083 8.00494 7.17781C8.28555 6.96479 8.46553 6.64194 8.82547 5.99623L9.15316 5.40838Z"
                                                                stroke="currentColor"
                                                                strokeWidth="1.5"
                                                            ></path>
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                            <div className="p-5">
                                                <div className="text-base">{params.description}</div>

                                                <div className="mt-8 ltr:text-right rtl:text-left">
                                                    <button type="button" className="btn btn-outline-danger" onClick={() => setIsViewNoteModal(false)}>
                                                        Close
                                                    </button>
                                                </div>
                                            </div>
                                        </Dialog.Panel>
                                    </Transition.Child>
                                </div>
                            </div>
                        </Dialog>
                    </Transition>
                </div>
            </div>
        </div>
    );
};

export default Notes;
