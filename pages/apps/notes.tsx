import PerfectScrollbar from 'react-perfect-scrollbar';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect, useRef, useCallback } from 'react';
import Swal from 'sweetalert2';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../../store';
import { setPageTitle } from '../../store/themeConfigSlice';
import axios from 'axios';
import { BsGear, BsPlus, BsArrowDownUp, BsCheckLg, BsTrash, BsCheck2All, BsPencilSquare, BsX, BsPencil, BsCloudUpload, BsFileEarmarkTextFill, BsFillClockFill } from 'react-icons/bs';
import { FaDownload } from "react-icons/fa";
import { FiLoader } from 'react-icons/fi';
import { ReactSortable } from 'react-sortablejs';
import React from 'react';
import 'react-quill/dist/quill.snow.css';
import dynamic from 'next/dynamic';
import * as Yup from 'yup';
import { Field, Form, Formik } from 'formik';
import Select from 'react-select';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { useSession } from 'next-auth/react';
import {useDropzone} from 'react-dropzone';
import imageCompression from 'browser-image-compression';
const ReactQuill = dynamic(import('react-quill'), { ssr: false });

const Notes = () => {
    const { data: session } = useSession();
    //console.log(session);

    const pageCount = 5;

    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Notes'));
    });

    interface Note {
        id: string,
        tags: { id: string, color: string, title: string }[],
        title: string,
        description: string,
        created: string,
        uploadCount: number,
    }

    interface UploadFile {
        id: string,
        sourceName: string,
        name: string,
        extension: string,
        size: number,
        downloadCount: number,
        created: string,
    }
    
    const [tagsListOption, setTagsListOption] = useState<Tag[]>([]);
    const [noteUpdating, setNoteUpdating] = useState(false);

    const fakeInsert = async () => {
        const axiosData = { module: 'fakeInsert', user: session?.user.id };
        const result = await axios.post('/api/notes', axiosData);
        //console.log(result.data);
        //affectedRows: 1, fieldCount: 0, info: "", insertId: 1, serverStatus: 2, warningStatus: 0

        if (result.data.affectedRows) {
            showMessage('정상적으로 저장하였습니다.');
            setPage(1);
            notesLoad();
        } else {
            showMessage('데이터를 저장하지 못했습니다.', 'error');
        }
    };

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
            [{ align: '' }, { align: 'center' }, { align: 'right' }, { align: 'justify' }],
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
        'align',
    ];

    const editNote = async (note: any = null) => {
        setIsShowNoteMenu(false);

        let option: any = [];
        tagsList.map((item: any) => {
            option.push({ id: item.id, value: item.id, label: item.title });
        });
        setTagsListOption(option);

        if (note) {
            setIsViewNoteModal(false);

            let option: any = [];
            note.tags.map((item: any) => {
                option.push({ id: item.id, value: item.id, label: item.title });
            });

            const imsiNote = { ...note, tags: option };
            //console.log(imsiNote);
            
            setParams(imsiNote);
        } else {
            setParams(defaultParams);
            setUploadFiles([]);
        }

        setNoteModal(true);
    };

    const getByte = (str: string): number => {
        return str
            .split('') 
            .map((s: string) => s.charCodeAt(0))
            .reduce((prev, c) => (prev + ((c === 10) ? 2 : ((c >> 7) ? 2 : 1))), 0);
    }

    const bytesToSize = (bytes: number): string => {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return 'n/a';
        const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
        if (i === 0) return `${bytes} ${sizes[i]}`;
        return `${(bytes / (1024 ** i)).toFixed(1)} ${sizes[i]}`;
    }

    const noteUpdate = async () => {
        //console.log(params);

        setNoteUpdating(true);

        // const size = getByte(params.description);
        // console.log(size);

        // if (size > 250000) {
        //     setNoteUpdating(false);
        //     showMessage(`현제 내용이 ${bytesToSize(size)} 입니다. 2MB 이하로 작성해 주십시오.`, 'error');
        //     return;
        // }

        let newTags = '';

        params.tags.map((item: any) => {
            let index = tagsList.findIndex(tag => tag.id === item.value);
            if (newTags.length > 0) newTags += ',';
            newTags += tagsList[index].id;
        });

        const axiosData = { module: 'noteUpdate', id: params.id, title: params.title, description: params.description, tags: newTags, user: session?.user.id };
        const result = await axios.post('/api/notes', axiosData);
        //console.log(result.data);

        if (result.data.affectedRows) {
            showMessage('정상적으로 저장하였습니다.');
            setParams(defaultParams);
            if (params.id === '') setPage(1); else notesLoad();
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
                const axiosData = { module: 'noteDelete', id: id };
                const result = await axios.post('/api/notes', axiosData);
                //console.log(result.data);

                if (result.data.affectedRows) {
                    showMessage('정상적으로 삭제하였습니다.');
                    setParams(defaultParams);
                    setPage(1);
                } else {
                    showMessage('데이터를 삭제하지 못했습니다.', 'error');
                }
            }
        });
    };

    const defaultParams: Note = {
        id: '',
        tags: [],
        title: '',
        description: '',
        created: '',
        uploadCount: 0,
    };

    const [page, setPage] = useState(1);
    const [startPage, setStartPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [endPage, setEndPage] = useState(0);
    const [pageBlock, setPageBlock] = useState<number[]>([]);
    const [totalPage, setTotalPage] = useState(0);
    const [notesList, setNotesList] = useState<Note[]>([]);
    const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
    const [params, setParams] = useState<Note>(defaultParams);
    const images = ['jpg', 'jpeg', 'png', 'gif'];

    const onDrop = useCallback(async (acceptedFiles: any) => {
        //console.log(acceptedFiles);
        /*path: "new_SAM_2116.JPG"
        lastModified: 1517660028493
        lastModifiedDate: Sat Feb 03 2018 21:13:48 GMT+0900 (한국 표준시) {}
        name: "new_SAM_2116.JPG"
        size: 938879
        type: "image/jpeg"
        webkitRelativePath: ""*/

        const formData = new FormData();

        acceptedFiles.map(async (item: any) => {
            // const fileName = item.name.split('.');
            // const fileExtension = fileName[fileName.length - 1];

            // if (images.includes(fileExtension.toLowerCase())) {
            //     const compressedBlob = await imageCompression(item, { maxWidthOrHeight: 1200, useWebWorker: true });
            //     const resizingFile = new File([compressedBlob], item.name, { type: item.type });
            //     //console.log(item, resizingFile);
            //     formData.append('files', resizingFile);
            // } else {
            //     //console.log(item);
            //     formData.append('files', item);
            // }
            formData.append('files', item);
        });
        
        formData.append('parentId', params.id);
        formData.append('user', session?.user.id as string);

        const result = await axios.post('/api/fileUpload', formData, { headers: { "Content-Type": "multipart/form-data" }});
        //console.log(result);

        setUploadFiles(result.data);
    }, [params]);

    // const dropZoneReset = () => {
    //     if (imgRef.current) {
    //         imgRef.current.value = "";
    //         URL.revokeObjectURL(imgUrl);
    //         setImgUrl((_pre) => "");
    //     }
    // };
    
    const {getRootProps, getInputProps, acceptedFiles} = useDropzone({ onDrop, maxFiles: 10, noClick: true, maxSize: 5000000 });

    const deleteFile = async (id: string, name: string) => {
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
                const axiosData = { module: 'deleteFile', id: id, name: name, user: session?.user.id };
                const result = await axios.post('/api/notes', axiosData);
                //console.log(result.data);

                if (result.data.affectedRows) {
                    const imsi = uploadFiles.filter(item => item.id !== id);
                    setUploadFiles(imsi);

                    showMessage('정상적으로 삭제하였습니다.');
                } else {
                    showMessage('데이터를 삭제하지 못했습니다.', 'error');
                }
            }
        });
    };
    
    const downFile = async (id: string, name: string) => {

    };

    useEffect(() => {
        if (session) notesLoad();
    }, [page, session]);

    const notesLoad = async () => {
        setIsViewNoteModal(false);
        setNoteUpdating(false);
        setNoteModal(false);
        setFilterTags('');

        const axiosData = { module: 'notesLoad', user: session?.user.id, page: page };
        const result = await axios.post('/api/notes', axiosData);

        //console.log(result.data);

        const imsiNotes: Note[] = [];

        result.data[0].map((item: any) => {
            let tagArray: Tag[] = [];
            const tagStringArray = item.tags ? item.tags.split(',') : [];

            tagStringArray.forEach((t: string) => {
                const filter_data = result.data[1].filter((tag: any) => tag.id == t);
                tagArray.push(filter_data[0]);
            });

            //console.log(tagArray);
            item.tags = tagArray;
        });

        //console.log(result.data);

        setTotalCount(result.data[2][0].totalCount);
        setTotalPage(result.data[2][0].totalPage);
        setNotesList(result.data[0]);

        let startPage = Math.trunc((page - 1) / pageCount) * pageCount + 1;
        let endPage = startPage + pageCount - 1;
        if (endPage >= result.data[2][0].totalPage) endPage = result.data[2][0].totalPage;
        let pageBlock: number[] = [];

        for (let i = startPage; i <= endPage; i++) {
            pageBlock.push(i);
        }

        setPageBlock(pageBlock);
        setStartPage(startPage);
        setEndPage(endPage);
    };

    const showNote = async (note: Note) => {
        //console.log(note);
        if (note.uploadCount) {
            const axiosData = { module: 'filesLoad', user: session?.user.id, id: note.id };
            const result = await axios.post('/api/notes', axiosData);
            //console.log(result.data);
            setUploadFiles(result.data);
        }

        setParams(note);
        setIsViewNoteModal(true);
    };
    
    const [noteModal, setNoteModal] = useState(false);
    const [isShowNoteMenu, setIsShowNoteMenu] = useState(false);
    const [isViewNoteModal, setIsViewNoteModal] = useState(false);
    const [filterdNotesList, setFilterdNotesList] = useState<Note[]>([]);
    const [filterTags, setFilterTags] = useState('');

    const searchNotes = () => {
        if (filterTags) {
            setFilterdNotesList(notesList.filter((item) => JSON.stringify(item.tags).includes(filterTags)));
        } else {
            setFilterdNotesList(notesList);
        }
    };

    const tabChanged = (id: string) => {
        setFilterTags(id);
        setIsShowNoteMenu(false);
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
            if (session) tagsLoad();
        }
    }, [tagsModal, session]);
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
        const axiosData = { module: 'tagAdd', category: 'note', user: session?.user.id, color: tagColor, title: tagTitle, seq: seq };
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
        const axiosData = { module: 'tagsLoad', category: 'note', user: session?.user.id };
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
                            <h3 className="text-lg font-semibold ltr:ml-3 rtl:mr-3">Notes ({totalCount})</h3>
                        </div>

                        <div className="my-4 h-px w-full border-b border-white-light dark:border-[#1b2e4b] mb-3"></div>
                        {session && (
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
                                                                            <button type="submit" className="btn btn-primary max-sm:btn-sm ltr:rounded-l-none rtl:rounded-r-none">
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
                                                                                            <button type="button" onClick={tagUpdate} data-id={item.id} className="btn btn-primary max-sm:btn-sm rounded-l-none rounded-r-none">
                                                                                                <BsCheckLg />
                                                                                            </button>
                                                                                            <button type="button" onClick={tagDelete} data-id={item.id} className="btn btn-danger max-sm:btn-sm rounded-l-none rounded-r-none">
                                                                                                <BsTrash />
                                                                                            </button>
                                                                                            <button type="button" className="handle cursor-move btn btn-dark max-sm:btn-sm ltr:rounded-l-none rtl:rounded-r-none">
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
                        )}
                    </div>
                    {session && (
                        <div className="absolute bottom-0 w-full p-4 ltr:left-0 rtl:right-0">
                            {/*<button className="btn btn-success max-sm:btn-sm w-full mb-5" type="button" onClick={fakeInsert}>
                                <svg className="h-5 w-5 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                Fake Data Insert
                            </button>*/}
                            <button className="btn btn-danger max-sm:btn-sm w-full mb-5" type="button" onClick={truncateTags}>
                                <BsTrash className="ltr:mr-2 rtl:ml-2" /> Truncate Tags
                            </button>
                            <button className="btn btn-danger max-sm:btn-sm w-full mb-5" type="button" onClick={truncateNotes}>
                                <BsTrash className="ltr:mr-2 rtl:ml-2" /> Truncate Notes
                            </button>
                            <button className="btn btn-primary max-sm:btn-sm w-full" type="button" onClick={() => editNote()}>
                                <svg className="h-5 w-5 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                Add New Note
                            </button>
                        </div>
                    )}
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
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                            {filterdNotesList.map((note: any) => {
                                return (
                                    <div className={`panel bg-${note.tags.length && note.tags[0].color}-light shadow-${note.tags.length && note.tags[0].color}`} key={note.id}>
                                        <button className="" onClick={() => showNote(note)}>
                                            <h4 className="font-semibold text-start line-clamp-1">{note.uploadCount > 0 && (<BsFileEarmarkTextFill className='mr-1' style={{ display: 'inline' }} />)}{note.title}</h4>
                                            <div className="mt-3 text-white-dark text-justify line-clamp-6 break-all" style={{minHeight: '120px'}}>{note.description.replace(/<[^>]*>?/g, '')}</div>
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

                            {/*//Card Skeleton
                            <div className="panel bg-gray-300 animate-pulse">
                                <h1 className="h-5 mt-1 bg-gray-200 rounded-lg dark:bg-gray-700"></h1>
                                <p className="mt-5 bg-gray-200 rounded-lg dark:bg-gray-700" style={{minHeight: '120px'}}></p>
                            </div>*/}
                        </div>
                    ) : (
                        <div className="flex h-full min-h-[400px] items-center justify-center text-lg font-semibold sm:min-h-[300px]">No data available</div>
                    )}

                    {totalPage > 1 && (
                        <div className="flex items-center justify-center mt-5">
                            <ul className="inline-flex items-center m-auto gap-1">
                                {page > 1 && (
                                    <li>
                                        <Tippy content="맨처음...">
                                            <button type="button" onClick={() => setPage(1)} className="flex justify-center font-semibold px-2 py-1 rounded transition text-dark hover:text-primary border-2 border-white-light dark:border-[#191e3a] hover:border-primary dark:hover:border-primary dark:text-white-light max-sm:btn-sm">
                                                《
                                            </button>
                                        </Tippy>
                                    </li>
                                )}
                                {startPage > 1 && (
                                    <li>
                                        <Tippy content={`이전 ${pageCount} 페이지`}>
                                            <button type="button" onClick={() => setPage(startPage-1)} className="flex justify-center font-semibold px-2 py-1 rounded transition text-dark hover:text-primary border-2 border-white-light dark:border-[#191e3a] hover:border-primary dark:hover:border-primary dark:text-white-light max-sm:btn-sm">
                                                〈
                                            </button>
                                        </Tippy>
                                    </li>
                                )}
                                {pageBlock.map((i: number) => {
                                    return (
                                    page === i ? (
                                        <li key={i}>
                                            <Tippy content={`${i} 페이지`}>
                                                <button type="button" className="flex justify-center font-semibold px-2 py-1 rounded transition text-primary border-2 border-primary dark:border-primary dark:text-white-light max-sm:btn-sm">
                                                    {i}
                                                </button>
                                            </Tippy>
                                        </li>
                                    ) : (
                                        <li key={i}>
                                            <Tippy content={`${i} 페이지`}>
                                                <button type="button" onClick={() => setPage(i)} className="flex justify-center font-semibold px-2 py-1 rounded transition text-dark hover:text-primary border-2 border-white-light dark:border-[#191e3a] hover:border-primary dark:hover:border-primary dark:text-white-light max-sm:btn-sm">
                                                    {i}
                                                </button>
                                            </Tippy>
                                        </li>
                                    ))
                                })}
                                {totalPage > endPage && (
                                    <li>
                                        <Tippy content={`다음 ${pageCount} 페이지`}>
                                            <button type="button" onClick={() => setPage(endPage+1)} className="flex justify-center font-semibold px-2 py-1 rounded transition text-dark hover:text-primary border-2 border-white-light dark:border-[#191e3a] hover:border-primary dark:hover:border-primary dark:text-white-light max-sm:btn-sm">
                                                〉
                                            </button>
                                        </Tippy>
                                    </li>
                                )}
                                {page < totalPage && (
                                    <li>
                                        <Tippy content="맨끝으로...">
                                            <button type="button" onClick={() => setPage(totalPage)} className="flex justify-center font-semibold px-2 py-1 rounded transition text-dark hover:text-primary border-2 border-white-light dark:border-[#191e3a] hover:border-primary dark:hover:border-primary dark:text-white-light max-sm:btn-sm">
                                                》
                                            </button>
                                        </Tippy>
                                    </li>
                                )}
                            </ul>
                        </div>
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
                                                                <ReactQuill id="description" theme="snow" value={params.description} onChange={(html: any) => setParams({ ...params, description: html })} modules={quillModules} formats={quillFormats} placeholder='내용을 작성하세요.' />
                                                                {submitCount ? errors.description ? <div className="mt-1 text-danger">{errors.description}</div> : '' : ''}
                                                            </div>
                                                            <div className="mb-3">
                                                                <Select id="tags" options={tagsListOption} defaultValue={params.tags} onChange={(event: any) => setParams({ ...params, tags: event })} placeholder="Select Tags" isMulti styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }} menuPortalTarget={document.body} />
                                                            </div>
                                                            <div className="mb-3">
                                                                <div {...getRootProps({ className: 'max-w-xl' })}>
                                                                    <label className="flex justify-center w-full h-16 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none">
                                                                        <span className="flex items-center space-x-2">
                                                                            <span className="font-medium text-gray-600"><BsCloudUpload style={{display: 'inline'}} /> MAX SIZE : 5MB</span>
                                                                        </span>
                                                                        <input {...getInputProps()} />
                                                                    </label>
                                                                </div>
                                                            </div>
                                                            {uploadFiles.length > 0 && (
                                                            <div className="mb-3">
                                                                <div className="grid gap-4 sm:grid-cols-3 grid-cols-1">
                                                                    {uploadFiles.map((item: any) => {
                                                                        if (images.includes(item.extension.toLowerCase())) {
                                                                            return (
                                                                                <div key={item.id} className="custom-file-container__image-preview relative">
                                                                                    <button type="button" onClick={() => deleteFile(item.id, item.name)} className="custom-file-container__image-clear absolute top-0 left-0 block w-fit rounded-full bg-dark-light p-0.5 dark:bg-dark dark:text-white-dark">
                                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                                                    </button>
                                                                                    <img src={`/upload/${session?.user.id}/${item.name}`} />
                                                                                </div>
                                                                            );
                                                                        } else {
                                                                            return (
                                                                                <div key={item.id} className="custom-file-container__image-preview relative item-center">
                                                                                    <button type="button" onClick={() => deleteFile(item.id, item.name)} className="custom-file-container__image-clear absolute top-0 left-0 block w-fit rounded-full bg-dark-light p-0.5 dark:bg-dark dark:text-white-dark">
                                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                                                    </button>
                                                                                    <input type="text" value={item.sourceName} title={item.sourceName} className="form-input bg-gray-100" disabled />
                                                                                </div>
                                                                            );
                                                                        }
                                                                    })}
                                                                </div>
                                                            </div>
                                                            )}
                                                            {params.id ? <div className="mb-3"><span className="badge badge-outline-info rounded-full ml-3"><BsPencilSquare style={{display: 'inline-block'}} /> {params.created.substring(0, 16).replace('T', ' ')}</span></div> : ''}
                                                            <div className="mt-8 flex items-center justify-end">
                                                                <button type="button" className="btn btn-outline-danger max-sm:btn-sm gap-2" onClick={() => setNoteModal(false)}>
                                                                    <BsX /> Cancel
                                                                </button>
                                                                <button type="submit" className="btn btn-primary max-sm:btn-sm ltr:ml-4 rtl:mr-4">
                                                                    {params.id ?
                                                                         <>{noteUpdating === false ? <BsPencilSquare className="mr-1" /> : <FiLoader className="animate-ping mr-1" />} Update Note</> 
                                                                    : 
                                                                        <> {noteUpdating === false ? <BsPlus className="mr-1" /> : <FiLoader className="animate-ping mr-1" />} Add Note</>}
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
                                                <span className="badge badge-outline-info rounded-full"><BsPencilSquare style={{display: 'inline-block'}} /> {params.created.substring(0, 16).replace('T', ' ')}</span>
                                            </div>
                                            <div className="p-5">
                                                {uploadFiles.length > 0 && (
                                                <div className="mb-3">
                                                    {uploadFiles.map((item: any) => {
                                                        if (!images.includes(item.extension.toLowerCase())) {
                                                            return (
                                                                <div key={item.id} className='container'>
                                                                    <button type="button" onClick={() => downFile(item.id, item.name)} className='text-sm'>
                                                                        {item.sourceName}
                                                                        <span className="badge bg-primary rounded-full ml-1">{bytesToSize(item.size)}</span>
                                                                        <span className="badge bg-success rounded-full ml-1"><FaDownload style={{display: 'inline'}} /> {item.downloadCount}</span>
                                                                        <span className="badge bg-dark rounded-full ml-1"><BsFillClockFill style={{display: 'inline'}} /> {item.created.replace('T', ' ').substring(0, 16)}</span>
                                                                    </button>
                                                                </div>
                                                            );
                                                        }
                                                    })}
                                                </div>
                                                )}
                                                
                                                <div className="ql-container" dangerouslySetInnerHTML={{__html: params.description }}></div>

                                                <div className="mt-5 flex justify-between">
                                                    <div>
                                                        <button type="button" data-id={params.id} className="btn btn-danger max-sm:btn-sm" onClick={noteDelete}>
                                                            <BsTrash className="mr-1" /> Delete
                                                        </button>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        <button type="button" className="btn btn-info max-sm:btn-sm" onClick={() => editNote(params)}>
                                                            <BsPencil className="mr-1" /> Edit
                                                        </button>
                                                        <button type="button" className="btn btn-outline-dark max-sm:btn-sm" onClick={() => setIsViewNoteModal(false)}>
                                                            <BsX className="mr-1" /> Close
                                                        </button>
                                                    </div>
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
