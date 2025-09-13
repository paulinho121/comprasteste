import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, Package, TrendingUp, ShoppingCart } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '@/lib/supabase'

const COLORS = {
  critico: '#ef4444',
  baixo: '#f97316', 
  atencao: '#eab308',
  ok: '#22c55e'
}

export default function Dashboard() {
  const [dados, setDados] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      setLoading(true)
      
      // Buscar todos os produtos
      const { data: produtos, error } = await supabase
        .from('produtos')
        .select('*')
      
      if (error) throw error

      if (!produtos || produtos.length === 0) {
        setDados({
          resumo: {
            total_produtos: 0,
            produtos_criticos: 0,
            produtos_baixos: 0,
            produtos_atencao: 0,
            produtos_ok: 0
          },
          distribuicao_status: {
            critico: 0,
            baixo: 0,
            atencao: 0,
            ok: 0
          },
          top_10_menor_estoque: [],
          produtos_para_compra: []
        })
        return
      }

      // Calcular dados do dashboard
      const produtosComStatus = produtos.map(produto => {
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

      const resumo = {
        total_produtos: produtosComStatus.length,
        produtos_criticos: produtosComStatus.filter(p => p.status === 'critico').length,
        produtos_baixos: produtosComStatus.filter(p => p.status === 'baixo').length,
        produtos_atencao: produtosComStatus.filter(p => p.status === 'atencao').length,
        produtos_ok: produtosComStatus.filter(p => p.status === 'ok').length
      }

      const distribuicao_status = {
        critico: resumo.produtos_criticos,
        baixo: resumo.produtos_baixos,
        atencao: resumo.produtos_atencao,
        ok: resumo.produtos_ok
      }

      const top_10_menor_estoque = produtosComStatus
        .sort((a, b) => a.estoque_total - b.estoque_total)
        .slice(0, 10)

      const produtos_para_compra = produtosComStatus
        .filter(p => p.sugestao_compra > 0)
        .sort((a, b) => b.sugestao_compra - a.sugestao_compra)
        .slice(0, 20)

      setDados({
        resumo,
        distribuicao_status,
        top_10_menor_estoque,
        produtos_para_compra
      })

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  if (!dados) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Erro ao carregar dados do dashboard</p>
      </div>
    )
  }

  const dadosGrafico = [
    { name: 'Crítico', value: dados.distribuicao_status.critico, color: COLORS.critico },
    { name: 'Baixo', value: dados.distribuicao_status.baixo, color: COLORS.baixo },
    { name: 'Atenção', value: dados.distribuicao_status.atencao, color: COLORS.atencao },
    { name: 'OK', value: dados.distribuicao_status.ok, color: COLORS.ok }
  ].filter(item => item.value > 0)

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dados.resumo.total_produtos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Crítico</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{dados.resumo.produtos_criticos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{dados.resumo.produtos_baixos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sugestões de Compra</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{dados.produtos_para_compra.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Pizza */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
            <CardDescription>Status atual do estoque por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosGrafico}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dadosGrafico.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Barras */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 - Menor Estoque</CardTitle>
            <CardDescription>Produtos com menor quantidade em estoque</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dados.top_10_menor_estoque}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="codigo" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [value, 'Estoque Total']}
                  labelFormatter={(label) => `Produto: ${label}`}
                />
                <Bar dataKey="estoque_total" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Sugestões de Compra */}
      {dados.produtos_para_compra.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sugestões de Compra Prioritárias</CardTitle>
            <CardDescription>Produtos que precisam ser reabastecidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dados.produtos_para_compra.slice(0, 10).map((produto) => (
                <div key={produto.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{produto.codigo}</span>
                      <Badge variant={produto.status === 'critico' ? 'destructive' : 'secondary'}>
                        {produto.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{produto.descricao}</p>
                    <div className="flex gap-4 text-xs text-gray-500 mt-1">
                      <span>Disponível: {produto.disponivel}</span>
                      <span>A caminho: {produto.a_caminho}</span>
                      <span>Total: {produto.estoque_total}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">
                      {produto.sugestao_compra}
                    </div>
                    <div className="text-xs text-gray-500">unidades</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

