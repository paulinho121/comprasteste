import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function UploadComponent({ onUploadSuccess }) {
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const processarPlanilha = async (file) => {
    try {
      setUploading(true)
      setMessage(null)

      // Verificar se é um arquivo Excel
      if (!file.name.match(/\.(xlsx|xls)$/)) {
        throw new Error('Por favor, selecione um arquivo Excel (.xlsx ou .xls)')
      }

      // Ler o arquivo como ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()
      
      // Importar a biblioteca XLSX dinamicamente
      const XLSX = await import('https://cdn.skypack.dev/xlsx')
      
      // Processar o arquivo Excel
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(worksheet)

      if (data.length === 0) {
        throw new Error('A planilha está vazia')
      }

      // Validar colunas necessárias
      const requiredColumns = ['Produto', 'Descrição do produto', 'Disponível', 'A caminho']
      const firstRow = data[0]
      const missingColumns = requiredColumns.filter(col => !(col in firstRow))
      
      if (missingColumns.length > 0) {
        throw new Error(`Colunas obrigatórias não encontradas: ${missingColumns.join(', ')}`)
      }

      // Processar dados e inserir no Supabase
      const produtos = data.map(row => ({
        codigo: String(row['Produto'] || '').trim(),
        descricao: String(row['Descrição do produto'] || '').trim(),
        disponivel: parseInt(row['Disponível']) || 0,
        a_caminho: parseInt(row['A caminho']) || 0,
        nivel_minimo: 5 // Valor padrão
      })).filter(produto => produto.codigo && produto.descricao)

      if (produtos.length === 0) {
        throw new Error('Nenhum produto válido encontrado na planilha')
      }

      // Limpar tabela existente e inserir novos dados
      const { error: deleteError } = await supabase
        .from('produtos')
        .delete()
        .neq('id', 0) // Deletar todos os registros

      if (deleteError) throw deleteError

      // Inserir novos produtos
      const { error: insertError } = await supabase
        .from('produtos')
        .insert(produtos)

      if (insertError) throw insertError

      setMessage({
        type: 'success',
        text: `Planilha processada com sucesso! ${produtos.length} produtos importados.`
      })

      // Notificar componente pai sobre o sucesso
      if (onUploadSuccess) {
        onUploadSuccess()
      }

    } catch (error) {
      console.error('Erro ao processar planilha:', error)
      setMessage({
        type: 'error',
        text: error.message || 'Erro ao processar a planilha'
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processarPlanilha(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      processarPlanilha(e.target.files[0])
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Planilha
          </CardTitle>
          <CardDescription>
            Faça upload da sua planilha de estoque para atualizar os dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-teal-500 bg-teal-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            
            <div className="space-y-2">
              <p className="text-lg font-medium">
                Arraste e solte sua planilha aqui
              </p>
              <p className="text-gray-500">
                ou clique para selecionar um arquivo
              </p>
            </div>
            
            <Button 
              onClick={openFileDialog}
              disabled={uploading}
              className="mt-4"
            >
              {uploading ? 'Processando...' : 'Selecionar Arquivo'}
            </Button>
            
            <p className="text-xs text-gray-400 mt-4">
              Formatos aceitos: .xlsx, .xls
            </p>
          </div>

          {message && (
            <Alert className={`mt-4 ${message.type === 'error' ? 'border-red-200' : 'border-green-200'}`}>
              {message.type === 'error' ? (
                <AlertCircle className="h-4 w-4 text-red-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              <AlertDescription className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Formato da Planilha</CardTitle>
          <CardDescription>
            Sua planilha deve conter as seguintes colunas obrigatórias:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Colunas Obrigatórias:</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• <strong>Produto</strong> - Código do produto</li>
                <li>• <strong>Descrição do produto</strong> - Nome/descrição</li>
                <li>• <strong>Disponível</strong> - Quantidade em estoque</li>
                <li>• <strong>A caminho</strong> - Quantidade em trânsito</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Observações:</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Os dados existentes serão substituídos</li>
                <li>• Valores numéricos devem ser números inteiros</li>
                <li>• Linhas vazias serão ignoradas</li>
                <li>• O nível mínimo será definido como 5 por padrão</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

