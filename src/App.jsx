import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Upload, Package, Menu } from 'lucide-react'
import Dashboard from './components/Dashboard'
import UploadComponent from './components/Upload'
import Produtos from './components/Produtos'
import logoMCI from './assets/LogoMCIPadrão.png'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)

  const handleUploadSuccess = () => {
    // Força a atualização dos componentes quando o upload é bem-sucedido
    setRefreshKey(prev => prev + 1)
    setActiveTab('dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <img 
                src={logoMCI} 
                alt="MCI Logo" 
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Sistema de Gestão de Compras
                </h1>
                <p className="text-sm text-gray-500">
                  Controle inteligente de estoque
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Navigation Tabs */}
          <TabsList className="grid w-full grid-cols-3 lg:w-96">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="produtos" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Produtos
            </TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          <TabsContent value="dashboard" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
              <p className="text-gray-600">
                Visão geral do status do estoque e sugestões de compra
              </p>
            </div>
            <Dashboard key={`dashboard-${refreshKey}`} />
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload de Planilha</h2>
              <p className="text-gray-600">
                Importe sua planilha de estoque para atualizar os dados
              </p>
            </div>
            <UploadComponent onUploadSuccess={handleUploadSuccess} />
          </TabsContent>

          <TabsContent value="produtos" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Gerenciar Produtos</h2>
              <p className="text-gray-600">
                Visualize e configure os produtos do seu estoque
              </p>
            </div>
            <Produtos key={`produtos-${refreshKey}`} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>© 2025 MCI - Sistema de Gestão de Compras. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App

