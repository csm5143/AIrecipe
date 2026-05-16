import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { downloadClient } from '@/api/request';

export type ExportFormat = 'csv' | 'xlsx' | 'json';

export interface ExportOptions {
  /** 导出文件的中文名称（如"菜谱"、"食材"） */
  name: string;
  /** 当前筛选条件总数（由调用方传入） */
  total: number;
  /** 导出接口，返回文件 blob */
  exportFn: (format: ExportFormat) => Promise<Blob>;
  /** 导出成功后回调 */
  onSuccess?: (format: ExportFormat) => void;
}

export function useExport() {
  const exportDialogVisible = ref(false);
  const exportFormat = ref<ExportFormat>('xlsx');
  const exporting = ref(false);
  const currentOptions = ref<ExportOptions | null>(null);

  function showExportDialog(options: ExportOptions) {
    currentOptions.value = options;

    if (options.total === 0) {
      ElMessage.warning('当前筛选条件下无数据，无法导出');
      return;
    }

    exportDialogVisible.value = true;
  }

  async function handleConfirm() {
    const opts = currentOptions.value;
    if (!opts) return;

    exporting.value = true;
    try {
      const blob = await opts.exportFn(exportFormat.value);
      const ext = exportFormat.value;
      const date = new Date().toISOString().slice(0, 10);
      const filename = `${opts.name}_${date}.${ext}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      ElMessage.success(`已导出 ${opts.total} 条${opts.name}数据`);
      opts.onSuccess?.(exportFormat.value);
      exportDialogVisible.value = false;
    } catch (err: any) {
      ElMessage.error(err?.message || '导出失败，请重试');
    } finally {
      exporting.value = false;
    }
  }

  return {
    exportDialogVisible,
    exportFormat,
    exporting,
    showExportDialog,
    handleConfirm,
  };
}

/**
 * 通过专用的 downloadClient 发起文件下载请求
 * - baseURL = '/v1' → Vite 开发服务器代理到后端 (http://localhost:3000/v1)
 * - 无 response interceptor → 可正确处理原始 binary/JSON 响应（非 { code, data } 格式）
 */
export async function downloadFile(
  url: string,
  params: Record<string, unknown>,
  format: ExportFormat,
): Promise<Blob> {
  const response = await downloadClient.get(url, {
    params: { ...params, format },
    responseType: 'arraybuffer',
  });
  return new Blob([response.data as ArrayBuffer], { type: getMimeType(format) });
}

function getMimeType(format: ExportFormat): string {
  const map: Record<ExportFormat, string> = {
    csv: 'text/csv;charset=utf-8',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    json: 'application/json;charset=utf-8',
  };
  return map[format];
}
