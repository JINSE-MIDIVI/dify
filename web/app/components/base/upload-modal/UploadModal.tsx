import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { UploadFile, UploadProps } from 'antd'
import { Button, Modal, Progress, Upload, message } from 'antd'
import { InboxOutlined, PaperClipOutlined } from '@ant-design/icons'
import upload from './upload.module.css'
import { uploadRequestBody } from '@/config'
import {
  createUploadFileIdRequest,
  getDatasetsIdRequest,
  getFileStatusRequest,
} from '@/service/upload'
const { Dragger } = Upload

export const UploadModal = () => {
  const { t } = useTranslation()
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false)
  const [uploadFileList, setUploadFileList] = useState<UploadFile[]>([])
  const [uploadingFileList, setUploadingFileList] = useState<any[]>([])
  const [uploadLoading, setUploadLoading] = useState<boolean>(false)
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(-1)
  const [progressMap, setProgressMap] = useState<any>({ filename: 0 })
  const [indexStausinterval, setIndexStausInterval] = useState<any>(null)
  const [datasetsId, setDataSetsId] = useState<string>()

  const handleUploadModalCancel = (intervalId: any) => {
    setIsUploadModalOpen(false)
    setUploadLoading(false)
    setUploadFileList([])
    setUploadingFileList([])
    setCurrentFileIndex(-1)
    setProgressMap({ filename: 0 })
    if (intervalId)
      clearInterval(intervalId)
    if (indexStausinterval)
      clearInterval(indexStausinterval)
  }

  const props: UploadProps = {
    disabled: uploadLoading,
    name: 'file',
    multiple: true,
    accept: '.txt,.md,.pdf,.html,.xls,.doc,.csv,.docx',
    beforeUpload: (file) => {
      // 检查文件大小是否符合要求
      const maxFileSize = 15 * 1024 * 1024 // 15MB
      if (file.size > maxFileSize) {
        message.info(t('uploadFile.message.file'))
        setUploadFileList([])
        return false
      }

      return false
    },
    onChange(info) {
      setUploadFileList(info.fileList)
      setUploadingFileList(info.fileList)
    },
    fileList: uploadFileList,
  }
  const getDatasetsId = async () => {
    const datasetIdResData: any = await getDatasetsIdRequest()
    if (datasetIdResData?.data?.data?.length > 0) {
      setDataSetsId(datasetIdResData?.data?.data[0]?.id)
      setCurrentFileIndex(0)
    }
    else {
      message.info('获取知识库列表失败')
    }
  }

  const getFileStatus = (getFileStatusResData: any, intervalId: any, uploadFileList: any) => {
    const indexStatus = getFileStatusResData?.indexing_status
    const newProgressMap: any = {}
    switch (indexStatus) {
      case 'parsing':
        newProgressMap[uploadFileList[currentFileIndex]?.name] = 25
        break
      case 'splitting':
        newProgressMap[uploadFileList[currentFileIndex]?.name] = 50
        break
      case 'indexing':
        newProgressMap[uploadFileList[currentFileIndex]?.name] = 75
        break
      case 'completed':
        newProgressMap[uploadFileList[currentFileIndex]?.name] = 100
        setCurrentFileIndex(prevIndex => prevIndex + 1)
        clearInterval(intervalId)
        break
      default:
        newProgressMap[uploadFileList[currentFileIndex]?.name] = 0
    }
    const mergedProgressMap = { ...progressMap, ...newProgressMap }

    setProgressMap(mergedProgressMap)
    if (indexStatus === 'completed' && currentFileIndex === uploadFileList.length - 1) {
      message.success(t('uploadFile.message.uploadSuccess'))
      handleUploadModalCancel(intervalId)
      setProgressMap({ filename: 0 })
    }
  }

  const handleSaveClick = async () => {
    setUploadLoading(true)
    setUploadFileList([])
    getDatasetsId()
  }
  const getUploadStatus = async (createUploadFileResData: any, intervalId: any, uploadFileList: any) => {
    const getFileStatusResData: any = await getFileStatusRequest(datasetsId ?? '', createUploadFileResData?.data?.batch ?? '')
    if (getFileStatusResData?.data?.data[0])
      getFileStatus(getFileStatusResData?.data?.data[0], intervalId, uploadFileList)

    else
      message.info('获取上传进度失败')
  }
  const createUploadFile = async (datasetsId: any, uploadFileList: any) => {
    const formData = new FormData()
    const datasetsParams = JSON.stringify(uploadRequestBody)
    const uploadFile = uploadFileList[currentFileIndex]?.originFileObj
    formData.append('data', datasetsParams)
    formData.append('file', uploadFile)
    formData.append('type', 'text/plain')
    const createUploadFileResData: any = await createUploadFileIdRequest(datasetsId, formData)
    console.log('createUploadFileResData', createUploadFileResData)
    if (createUploadFileResData?.data?.batch) {
      const intervalId = setInterval(() => {
        getUploadStatus(createUploadFileResData, intervalId, uploadFileList)
      }, 1000)
      setIndexStausInterval(intervalId)
    }
    else {
      message.info('上传文件失败')
    }
  }

  // Effect to trigger indexing status fetch for the current file
  useEffect(() => {
    if (uploadingFileList.length > 0 && currentFileIndex < uploadingFileList.length)
      createUploadFile(datasetsId, uploadingFileList)
  }, [currentFileIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleUploadClick = () => {
    setIsUploadModalOpen(true)
  }

  /* eslint-disable react/jsx-key */
  return (
    <>
      <Button className={upload.upload_btn} icon={<PaperClipOutlined />} onClick={handleUploadClick}/>
      <Modal
        title={t('uploadFile.title')}
        open={isUploadModalOpen}
        onCancel={handleUploadModalCancel}
        footer={[
          <Button onClick={handleSaveClick} loading={uploadLoading}>
            {t('uploadFile.button.save')}
          </Button>,
        ]}
      >
        <Dragger {...props}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">{t('')}</p>
          <p className="ant-upload-hint">
            {t('uploadFile.message.allowFileType')}
          </p>
        </Dragger>
        {
          uploadLoading && uploadingFileList?.length > 0 && uploadingFileList?.map((item: any, index: number) => <div
            key={index}>
            {progressMap[item?.file?.name] !== 100 && <div>{item?.name ?? ''}</div>}
            {progressMap[item?.file?.name] !== 100 && <Progress percent={progressMap[item?.name]} />}
          </div>)
        }
      </Modal>
    </>
  )
}
