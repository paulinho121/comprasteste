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

      if (!file.name.match(/\.(xlsx|xls)$/)) {
        throw new Error('Por favor, selecione um arquivo Excel (.xlsx ou .xls)')
      }

      const arrayBuffer = await file.arrayBuffer()
      const XLSX = await import('xlsx')
      
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

      // Processar dados
      const produtos = data.map(row => ({
        codigo: String(row['Produto'] || '').trim(),
        descricao: String(row['Descrição do produto'] || '').trim(),
        disponivel: parseInt(row['Disponível']) || 0,
        a_caminho: parseInt(row['A caminho']) || 0,
        nivel_minimo: 5
      })).filter(produto => produto.codigo && produto.descricao)

      if (produtos.length === 0) {
        throw new Error('Nenhum produto válido encontrado na planilha')
      }

      // Fazer UPSERT dos dados (atualiza se existir, insere se não existir)
      const { error } = await supabase
        .from('produtos')
        .upsert(produtos, {
          onConflict: 'codigo',
          ignoreDuplicates: false
        })

      if (error) throw error

      setMessage({
        type: 'success',
        text: `Planilha processada com sucesso! ${produtos.length} produtos importados/atualizados.`
      })

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

  // ... (o restante do código permanece igual)
  return (
    <div className="space-y-6">
      {/* O JSX permanece igual */}
    </div>
  )
}
