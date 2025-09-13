import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Search, Settings, Package, AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const STATUS_CONFIG = {
  critico: { 
    label: 'Crítico', 
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertTriangle,
    iconColor: 'text-red-600'
  },
  baixo: { 
    label: 'Baixo', 
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: TrendingUp,
    iconColor: 'text-orange-600'
  },
  atencao: { 
    label: 'Atenção', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Package,
    iconColor: 'text-yellow-600'
  },
  ok: { 
    label: 'OK', 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    iconColor: 'text-green-600'
  }
}

export default function Produtos() {
  const [produtos, setProdutos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('todos')
  const [produtoEditando, setProdutoEditando] = useState(null)
  const [novoNivelMinimo, setNovoNivelMinimo] = useState('')

  useEffect(() => {
    carregarProdutos()
  }, [])

  const carregarProdutos = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('codigo')
      
      if (error) throw error

      const produtosComStatus = (data || []).map(produto => {
        const estoque_total = (produto.disponivel || 0) + (produto.a_caminho || 0)
        let status = 'ok'
        
        if (estoque_total <= 0) {
          status = 'critico'
        } else if (estoque_total <= produto.nivel_minimo) {
          status = 'baixo'
        } else if (estoque_total <= produto.nivel_minimo * 1.5) {
          status = 'atencao'
        }

        const sugestao_compra = status === 'critico' || status === 'baixo' 
          ? Math.max(0, produto.nivel_minimo + Math.max(5, Math.floor(produto.nivel_minimo * 0.5)) - estoque_total)
          : 0

        return {
          ...produto,
          estoque_total,
          status,
          sugestao_compra
        }
      })

      setProdutos(produtosComStatus)
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    } finally {
      setLoading(false)
    }
  }

  const atualizarNivelMinimo = async () => {
    if (!produtoEditando || !novoNivelMinimo) return

    try {
      const { error } = await supabase
        .from('produtos')
        .update({ nivel_minimo: parseInt(novoNivelMinimo) })
        .eq('id', produtoEditando.id)

      if (error) throw error

      await carregarProdutos()
      setProdutoEditando(null)
      setNovoNivelMinimo('')
    } catch (error) {
      console.error('Erro ao atualizar nível mínimo:', error)
    }
  }

  const produtosFiltrados = produtos.filter(produto => {
    const matchFiltro = produto.codigo.toLowerCase().includes(filtro.toLowerCase()) ||
                       produto.descricao.toLowerCase().includes(filtro.toLowerCase())
    
    const matchStatus = statusFiltro === 'todos' || produto.status === statusFiltro
    
    return matchFiltro && matchStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busque e filtre produtos por código, descrição ou status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por código ou descrição..."
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="critico">Crítico</SelectItem>
                  <SelectItem value="baixo">Baixo</SelectItem>
                  <SelectItem value="atencao">Atenção</SelectItem>
                  <SelectItem value="ok">OK</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Produtos */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos ({produtosFiltrados.length})</CardTitle>
          <CardDescription>
            Lista completa de produtos com status de estoque
          </CardDescription>
        </CardHeader>
        <CardContent>
          {produtosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">
                {produtos.length === 0 
                  ? 'Nenhum produto encontrado. Faça upload de uma planilha primeiro.'
                  : 'Nenhum produto corresponde aos filtros aplicados.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {produtosFiltrados.map((produto) => {
                const statusConfig = STATUS_CONFIG[produto.status]
                const StatusIcon = statusConfig.icon

                return (
                  <div key={produto.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-lg">{produto.codigo}</span>
                          <Badge className={statusConfig.color}>
                            <StatusIcon className={`h-3 w-3 mr-1 ${statusConfig.iconColor}`} />
                            {statusConfig.label}
                          </Badge>
                          {produto.sugestao_compra > 0 && (
                            <Badge variant="outline" className="text-blue-600 border-blue-200">
                              Comprar: {produto.sugestao_compra}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-700 mb-3">{produto.descricao}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Disponível:</span>
                            <div className="font-medium">{produto.disponivel}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">A caminho:</span>
                            <div className="font-medium">{produto.a_caminho}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Total:</span>
                            <div className="font-bold text-lg">{produto.estoque_total}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Nível mínimo:</span>
                            <div className="font-medium">{produto.nivel_minimo}</div>
                          </div>
                          <div className="flex items-center">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setProdutoEditando(produto)
                                    setNovoNivelMinimo(produto.nivel_minimo.toString())
                                  }}
                                >
                                  <Settings className="h-4 w-4 mr-1" />
                                  Configurar
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Configurar Produto</DialogTitle>
                                  <DialogDescription>
                                    Ajuste o nível mínimo de estoque para {produto.codigo}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="nivel-minimo">Nível Mínimo</Label>
                                    <Input
                                      id="nivel-minimo"
                                      type="number"
                                      value={novoNivelMinimo}
                                      onChange={(e) => setNovoNivelMinimo(e.target.value)}
                                      placeholder="Digite o nível mínimo"
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setProdutoEditando(null)}>
                                    Cancelar
                                  </Button>
                                  <Button onClick={atualizarNivelMinimo}>
                                    Salvar
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

