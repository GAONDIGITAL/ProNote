import PerfectScrollbar from 'react-perfect-scrollbar';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../../store';
import { setPageTitle } from '../../store/themeConfigSlice';
import axios from 'axios';
import { BsGear, BsPlus, BsArrowDownUp, BsCheckLg, BsTrash, BsCheck2All, BsPencilSquare, BsX } from 'react-icons/bs';
import { FiLoader } from 'react-icons/fi';
import { ReactSortable } from 'react-sortablejs';
import React from 'react';
import 'react-quill/dist/quill.snow.css';
import dynamic from 'next/dynamic';
import * as Yup from 'yup';
import { Field, Form, Formik } from 'formik';
import Select from 'react-select';
const ReactQuill = dynamic(import('react-quill'), { ssr: false });

const Notes = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Notes'));
    });

    interface Note {
        id: string,
        tags: { id: string, color: string, title: string }[],
        title: string,
        description: string,
        created: string
    }
    
    const [tagsListOption, setTagsListOption] = useState<Tag[]>([]);
    const [noteUpdating, setNoteUpdating] = useState(false);

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
    
    const noteForm = Yup.object().shape({
        id: Yup.string(),
        tags: Yup.array().of(
          Yup.object().shape({
            label: Yup.string().required(),
            value: Yup.string().required()
          })
        ),
        title: Yup.string().min(2, '2 글자 이상 입력해 주십시오.').max(255, '255 글자 이하로 입력해 주십시오.').required('제목을 입력하세요.'),
        description: Yup.string().required('내용을 입력하세요.'),
    });

    const quillModules = {
        toolbar: [
            ['bold', 'italic'],
            [
                { list: 'ordered' },
                { list: 'bullet' },
            ],
            ['link', 'image', 'video']
        ],
        clipboard: {
            matchVisual: false,//HTML을 붙여넣을 때 추가 줄바꿈을 추가하려면 토글합니다.
        },
    };

    const quillFormats = [
        'header',
        'font',
        'size',
        'bold',
        'italic',
        'underline',
        'strike',
        'blockquote',
        'list',
        'bullet',
        'indent',
        'link',
        'image',
        'video',
    ];

    const noteUpdate = async () => {
        //console.log(params);

        setNoteUpdating(true);

        let newTags = '';

        params.tags.map((item: any) => {
            let index = tagsList.findIndex(tag => tag.id === item.value);
            if (newTags.length > 0) newTags += ',';
            newTags += tagsList[index].id;
        });

        const axiosData = { module: 'noteUpdate', id: params.id, title: params.title, description: params.description, tags: newTags, user: 'TEST' };
        const result = await axios.post('/api/notes', axiosData);
        //console.log(result.data);

        if (result.data.affectedRows) {
            showMessage('정상적으로 저장하였습니다.');
            setParams(defaultParams);
            setNoteUpdating(false);
            setNoteModal(false);
            setFilterTags('');
            searchNotes();
        } else {
            showMessage('데이터를 저장하지 못했습니다.', 'error');
            setNoteUpdating(false);
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
                    setParams(defaultParams);
                    setNoteUpdating(false);
                    setNoteModal(false);
                    setFilterTags('');
                    searchNotes();
                } else {
                    showMessage('데이터를 삭제하지 못했습니다.', 'error');
                }
            }
        });
    };

    const [notesList, setNotesList] = useState<Note[]>([]);

    useEffect(() => {
        notesLoad();
    }, []);

    const notesLoad = async () => {
        const axiosData = { module: 'notesLoad', user: 'TEST' };
        const result = await axios.post('/api/notes', axiosData);

        //console.log(result.data);

        const imsiNotes: Note[] = [];

        result.data[0].map((item: any) => {
            let tagArray: Tag[] = [];
            const tagStringArray = item.tags.split(',');

            tagStringArray.forEach((t: string) => {
                const filter_data = result.data[1].filter((tag) => tag.id == t);
                tagArray.push(filter_data[0]);
            });

            //console.log(tagArray);
            item.tags = tagArray;
        });

        console.log(result.data[0]);
        setNotesList(result.data[0]);
    };

    const showNote = (note: Note) => {
        //console.log(note);
        setParams(note);
        setIsViewNoteModal(true);
    };

    const defaultParams: Note = {
        id: '',
        tags: [],
        title: '',
        description: '',
        created: ''
    };
    //const [params, setParams] = useState<any>(JSON.parse(JSON.stringify(defaultParams)));
    const [params, setParams] = useState<Note>(defaultParams);
    const [noteModal, setNoteModal] = useState(false);
    const [isShowNoteMenu, setIsShowNoteMenu] = useState(false);
    const [isViewNoteModal, setIsViewNoteModal] = useState(false);
    const [filterdNotesList, setFilterdNotesList] = useState<Note[]>([]);
    const [filterTags, setFilterTags] = useState('');

    const searchNotes = () => {
        if (filterTags) {
            setFilterdNotesList(notesList.filter((item) => JSON.stringify(item.tags).indexOf(filterTags) !== -1));
        } else {
            setFilterdNotesList(notesList);
        }
    };

    const tabChanged = (id: string) => {
        setFilterTags(id);
        setIsShowNoteMenu(false);
    };

    const viewNote = (note: any) => {
        setParams(note);
        setIsViewNoteModal(true);
    };

    const editNote = (note: any = null) => {
        setIsShowNoteMenu(false);

        if (note) {
            let json1 = JSON.parse(JSON.stringify(note));
            setParams(json1);
        } else {
            const json = JSON.parse(JSON.stringify(defaultParams));
            setParams(json);
        }

        let option: any = [];
        tagsList.map((item: any) => {
            option.push({ value: item.id, label: item.title });
        });
        setTagsListOption(option);

        setNoteModal(true);
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
        //console.log(result.data);
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
                                        onClick={() => tabChanged(`${item.id}`)}
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
                        <div className="">
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                                {filterdNotesList.map((note: any) => {
                                    return (
                                        <div className={`panel bg-${note.tags[0].color}-light shadow-${note.tags[0].color}`} key={note.id}>
                                            <button className="" onClick={() => showNote(note)}>
                                                <h4 className="font-semibold text-start">{note.title}</h4>
                                                <div className="mt-3 text-white-dark text-justify line-clamp-6">{note.description.replace(/<[^>]*>?/g, '')}</div>
                                            </button>
                                            <div className="mt-3">
                                                {note.tags.map((tag: any) => 
                                                    <button key={tag.id} onClick={() => tabChanged(`${tag.id}`)}>
                                                        <span className={`badge bg-${tag.color} rounded-full mr-1`}>{tag.title}</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-full min-h-[400px] items-center justify-center text-lg font-semibold sm:min-h-[300px]">No data available</div>
                    )}

                    <Transition appear show={noteModal} as={Fragment}>
                        <Dialog as="div" open={noteModal} onClose={() => setNoteModal(false)} className="relative z-50">
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
                                                onClick={() => setNoteModal(false)}
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
                                                <Formik
                                                    initialValues={params}
                                                    enableReinitialize={true}
                                                    validationSchema={noteForm}
                                                    onSubmit={noteUpdate}
                                                >
                                                    {({ errors, submitCount, touched, values }) => (
                                                        <Form>
                                                            <div className={`mb-3 ${submitCount ? (errors.title ? 'has-error' : 'has-success') : ''}`}>
                                                                <Field id="title" type="text" value={params.title} onChange={(event: any) => setParams({ ...params, title: event.currentTarget.value })} placeholder="제목을 입력하세요." className="form-input" />
                                                                    {submitCount ? errors.title ? <div className="text-danger mt-1">{errors.title}</div> : '' : ''}
                                                            </div>
                                                            <div className={`mb-3 ${submitCount ? (errors.description ? 'has-error' : 'has-success') : ''}`}>
                                                                <ReactQuill id="description" theme="snow" value={params.description} onChange={(html: any) => setParams({ ...params, description: html })} modules={quillModules} formats={quillFormats} />
                                                                {submitCount ? errors.description ? <div className="mt-1 text-danger">{errors.description}</div> : '' : ''}
                                                            </div>
                                                            <div className="mb-3">
                                                                <Select id="tags" name="tags" placeholder="Select Tags" options={tagsListOption} onChange={(event: any) => setParams({ ...params, tags: event })} isMulti styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }} menuPortalTarget={document.body} />
                                                            </div>
                                                            {params.id ? <div className="mb-3"><span className="badge badge-outline-info rounded-full ml-3"><BsPencilSquare style={{display: 'inline-block'}} /> {params.created.substring(0, 16)}</span></div> : ''}
                                                            <div className="mt-8 flex items-center justify-end">
                                                                <button type="button" className="btn btn-outline-danger gap-2" onClick={() => setNoteModal(false)}>
                                                                    <BsX /> Cancel
                                                                </button>
                                                                <button type="submit" className="btn btn-primary ltr:ml-4 rtl:mr-4">
                                                                    {params.id ? <>{noteUpdating === false ? <BsPencilSquare />:<FiLoader className="animate-ping" />} Update Note</> : <> {noteUpdating === false ? <BsPlus /> : <FiLoader className="animate-ping" />} Add Note</>}
                                                                </button>
                                                            </div>
                                                        </Form>
                                                    )}
                                                </Formik>
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
                                        <Dialog.Panel className="panel w-full max-w-5xl overflow-hidden rounded-lg border-0 p-0 text-black dark:text-white-dark">
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
                                                {params.tags.map((tag: any) => <span key={tag.id} className={`badge bg-${tag.color} rounded-full`}>{tag.title}</span>)}
                                            </div>
                                            <div className="p-5">
                                                <div className="ql-editor" dangerouslySetInnerHTML={{__html: params.description }}></div>

                                                <div className="mt-8 flex items-center justify-end">
                                                    <button type="button" className="btn btn-outline-danger" onClick={() => setIsViewNoteModal(false)}>
                                                        <BsX /> Close
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
