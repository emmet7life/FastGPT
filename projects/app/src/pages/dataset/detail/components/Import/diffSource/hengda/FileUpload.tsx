import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ImportSourceItemType } from '@/web/core/dataset/type.d';
import { Box, Button } from '@chakra-ui/react';
import FileSelector from '../../components/hengda/FileSelector';
import { useTranslation } from 'next-i18next';

import dynamic from 'next/dynamic';
import { RenderUploadFiles } from '../../components/hengda/RenderFiles';
import { useContextSelector } from 'use-context-selector';
import { DatasetImportContext } from '../../Context';

const Upload = dynamic(() => import('../../commonProgress/hengda/Upload'));

const fileType = '.pdf';

const FileLocal = () => {
  const activeStep = useContextSelector(DatasetImportContext, (v) => v.activeStep);

  return (
    <>
      {activeStep === 0 && <SelectFile />}
      {activeStep === 1 && <Upload />}
    </>
  );
};

export default React.memo(FileLocal);

const SelectFile = React.memo(function SelectFile() {
  const { t } = useTranslation();
  const { goToNext, sources, setSources } = useContextSelector(DatasetImportContext, (v) => v);
  const [selectFiles, setSelectFiles] = useState<ImportSourceItemType[]>(
    sources.map((source) => ({
      isUploading: false,
      ...source
    }))
  );
  const [uploading, setUploading] = useState(false);
  const successFiles = useMemo(() => selectFiles.filter((item) => !item.errorMsg), [selectFiles]);

  useEffect(() => {
    setSources(successFiles);
  }, [setSources, successFiles]);

  const onclickNext = useCallback(() => {
    // filter uploaded files
    setSelectFiles((state) => state.filter((item) => item.dbFileId));
    goToNext();
  }, [goToNext]);

  return (
    <Box>
      <FileSelector
        fileType={fileType}
        selectFiles={selectFiles}
        setSelectFiles={setSelectFiles}
        onStartSelect={() => setUploading(true)}
        onFinishSelect={() => setUploading(false)}
      />

      {/* render files */}
      <RenderUploadFiles files={selectFiles} setFiles={setSelectFiles} showPreviewContent />

      <Box textAlign={'right'} mt={5}>
        <Button isDisabled={successFiles.length === 0 || uploading} onClick={onclickNext}>
          {selectFiles.length > 0
            ? `${t('core.dataset.import.Total files', { total: selectFiles.length })} | `
            : ''}
          {t('common:common.Next Step')}
        </Button>
      </Box>
    </Box>
  );
});
