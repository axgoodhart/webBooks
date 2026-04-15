import { useState, useRef, useCallback, useEffect } from 'react'
import './App.css'
import {
  Upload,
  Settings,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Maximize,
  Minimize,
  Layers,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'



import { GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.entry';

GlobalWorkerOptions.workerSrc = pdfWorker;



// Types
interface ViewerSettings {
  bindingType: 'magazine' | 'softcover' | 'hardcover'
  coverStyle: 'leather' | 'fabric' | 'matte' | 'glossy'
  paperTexture: 'smooth' | 'rough' | 'cream' | 'newsprint'
  coverColor: string
  pageShadow: boolean
  pageCurl: boolean
  autoFlip: boolean
  flipSpeed: number
  showPageNumbers: boolean
}

interface PDFPage {
  num: number
  imageUrl: string
}

const defaultSettings: ViewerSettings = {
  bindingType: 'magazine',
  coverStyle: 'leather',
  paperTexture: 'cream',
  coverColor: '#3d2914',
  pageShadow: true,
  pageCurl: true,
  autoFlip: false,
  flipSpeed: 600,
  showPageNumbers: true,
}

const coverColors = [
  { name: 'Classic Brown', value: '#3d2914' },
  { name: 'Deep Navy', value: '#1a1a3e' },
  { name: 'Burgundy', value: '#4a1a2e' },
  { name: 'Forest Green', value: '#1a3d2e' },
  { name: 'Charcoal', value: '#2d2d2d' },
  { name: 'Cream', value: '#e8e4d9' },
  { name: 'Rose Gold', value: '#b76e79' },
  { name: 'Midnight Blue', value: '#0f0f23' },
]

function App() {
  const [pdf, setPdf] = useState<pdfjs.PDFDocumentProxy | null>(null)
  const [pages, setPages] = useState<PDFPage[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<ViewerSettings>(defaultSettings)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [isFlipping, setIsFlipping] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const bookRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const loadedPdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
      setPdf(loadedPdf)
      setTotalPages(loadedPdf.numPages)
      setCurrentPage(0)

      // Render all pages
      const renderedPages: PDFPage[] = []
      for (let i = 1; i <= loadedPdf.numPages; i++) {
        const page = await loadedPdf.getPage(i)
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')

        const scale = 1.5
        const viewport = page.getViewport({ scale })
        canvas.width = viewport.width
        canvas.height = viewport.height

        if (context) {
          await page.render({ canvasContext: context, viewport, canvas }).promise
          renderedPages.push({
            num: i,
            imageUrl: canvas.toDataURL('image/jpeg', 0.9)
          })
        }
      }

      setPages(renderedPages)
    } catch (error) {
      console.error('Error loading PDF:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Navigation
  const goToPage = useCallback((pageNum: number) => {
    if (pageNum < 0 || pageNum >= totalPages || isFlipping) return
    setIsFlipping(true)
    setCurrentPage(pageNum)
    setTimeout(() => setIsFlipping(false), settings.flipSpeed)
  }, [totalPages, isFlipping, settings.flipSpeed])

  const nextPage = useCallback(() => {
    goToPage(currentPage + 2)
  }, [currentPage, goToPage])

  const prevPage = useCallback(() => {
    goToPage(currentPage - 2)
  }, [currentPage, goToPage])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextPage()
      if (e.key === 'ArrowLeft') prevPage()
      if (e.key === 'Escape' && isFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextPage, prevPage, isFullscreen])

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [isFullscreen])

  // Get binding class
  const getBindingClass = () => {
    switch (settings.bindingType) {
      case 'magazine': return 'magazine-binding'
      case 'softcover': return 'softcover-binding'
      case 'hardcover': return 'softcover-binding'
      default: return 'magazine-binding'
    }
  }

  // Get paper texture class
  const getPaperTextureClass = () => {
    switch (settings.paperTexture) {
      case 'smooth': return 'paper-texture-smooth'
      case 'rough': return 'paper-texture-rough'
      case 'cream': return 'paper-texture-cream'
      case 'newsprint': return 'paper-texture-newsprint'
      default: return 'paper-texture-cream'
    }
  }

  // Get cover style class
  const getCoverStyleClass = () => {
    switch (settings.coverStyle) {
      case 'leather': return 'cover-leather'
      case 'fabric': return 'cover-fabric'
      case 'matte': return 'cover-matte'
      case 'glossy': return 'cover-glossy'
      default: return 'cover-leather'
    }
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-[#1a1510] via-[#0f0c09] to-[#1a1510] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-black/30 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Magazine<span className="text-amber-500">View</span></h1>
            <p className="text-xs text-white/50">PDF Magazine Viewer</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pdf && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm text-white/70 w-16 text-center">{Math.round(zoom * 100)}%</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom(z => Math.min(2, z + 0.1))}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </>
          )}

          <div className="w-px h-6 bg-white/10 mx-2" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-white/70 hover:text-white hover:bg-white/10 gap-2"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Upload PDF</span>
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
          />

          <Sheet open={showSettings} onOpenChange={setShowSettings}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white hover:bg-white/10 gap-2"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md bg-[#1a1510]/95 backdrop-blur-xl border-white/10">
              <SheetHeader>
                <SheetTitle className="text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Customization
                </SheetTitle>
              </SheetHeader>

              <Tabs defaultValue="binding" className="mt-6">
                <TabsList className="grid w-full grid-cols-3 bg-white/5">
                  <TabsTrigger value="binding" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Binding
                  </TabsTrigger>
                  <TabsTrigger value="paper" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500">
                    <Layers className="w-4 h-4 mr-2" />
                    Paper
                  </TabsTrigger>
                  <TabsTrigger value="effects" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Effects
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="binding" className="space-y-6 mt-6">
                  <div className="space-y-3">
                    <Label className="text-white/70">Binding Type</Label>
                    <Select
                      value={settings.bindingType}
                      onValueChange={(v) => setSettings(s => ({ ...s, bindingType: v as any }))}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1510] border-white/10">
                        <SelectItem value="magazine">Magazine (Saddle Stitch)</SelectItem>
                        <SelectItem value="softcover">Softcover (Perfect Bind)</SelectItem>
                        <SelectItem value="hardcover">Hardcover</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-white/70">Cover Style</Label>
                    <Select
                      value={settings.coverStyle}
                      onValueChange={(v) => setSettings(s => ({ ...s, coverStyle: v as any }))}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1510] border-white/10">
                        <SelectItem value="leather">Leather Texture</SelectItem>
                        <SelectItem value="fabric">Fabric Texture</SelectItem>
                        <SelectItem value="matte">Matte Finish</SelectItem>
                        <SelectItem value="glossy">Glossy Finish</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-white/70">Cover Color</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {coverColors.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setSettings(s => ({ ...s, coverColor: color.value }))}
                          className={`w-full aspect-square rounded-lg border-2 transition-all ${settings.coverColor === color.value
                              ? 'border-amber-500 scale-110'
                              : 'border-transparent hover:border-white/30'
                            }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="paper" className="space-y-6 mt-6">
                  <div className="space-y-3">
                    <Label className="text-white/70">Paper Texture</Label>
                    <Select
                      value={settings.paperTexture}
                      onValueChange={(v) => setSettings(s => ({ ...s, paperTexture: v as any }))}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1510] border-white/10">
                        <SelectItem value="smooth">Smooth (Glossy)</SelectItem>
                        <SelectItem value="rough">Rough (Textured)</SelectItem>
                        <SelectItem value="cream">Cream (Off-white)</SelectItem>
                        <SelectItem value="newsprint">Newsprint</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-white/70">Page Shadow</Label>
                      <Switch
                        checked={settings.pageShadow}
                        onCheckedChange={(v) => setSettings(s => ({ ...s, pageShadow: v }))}
                      />
                    </div>
                    <p className="text-xs text-white/40">Adds realistic shadow between pages</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-white/70">Page Curl Effect</Label>
                      <Switch
                        checked={settings.pageCurl}
                        onCheckedChange={(v) => setSettings(s => ({ ...s, pageCurl: v }))}
                      />
                    </div>
                    <p className="text-xs text-white/40">Shows page corner curl on hover</p>
                  </div>
                </TabsContent>

                <TabsContent value="effects" className="space-y-6 mt-6">
                  <div className="space-y-3">
                    <Label className="text-white/70">Flip Speed (ms)</Label>
                    <Slider
                      value={[settings.flipSpeed]}
                      onValueChange={([v]) => setSettings(s => ({ ...s, flipSpeed: v }))}
                      min={200}
                      max={1000}
                      step={50}
                      className="py-2"
                    />
                    <div className="flex justify-between text-xs text-white/40">
                      <span>Fast (200ms)</span>
                      <span>{settings.flipSpeed}ms</span>
                      <span>Slow (1000ms)</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-white/70">Show Page Numbers</Label>
                      <Switch
                        checked={settings.showPageNumbers}
                        onCheckedChange={(v) => setSettings(s => ({ ...s, showPageNumbers: v }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full border-white/10 text-white/70 hover:text-white hover:bg-white/10"
                      onClick={() => setSettings(defaultSettings)}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset to Defaults
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </SheetContent>
          </Sheet>

          {pdf && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden">
        {!pdf ? (
          <div className="text-center animate-float">
            <div
              className="w-48 h-64 mx-auto mb-8 rounded-r-2xl shadow-2xl cursor-pointer transition-transform hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${settings.coverColor} 0%, ${settings.coverColor}dd 100%)`,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 4px 0 20px rgba(0,0,0,0.3)'
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="h-full flex flex-col items-center justify-center p-6 border-l-4 border-black/20">
                <BookOpen className="w-16 h-16 text-white/80 mb-4" />
                <p className="text-white/60 text-sm text-center">Click to upload PDF</p>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Ready to Read</h2>
            <p className="text-white/50 max-w-md mx-auto mb-6">
              Upload a PDF to experience it as a beautiful magazine with realistic page-flipping effects
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload PDF
            </Button>
          </div>
        ) : isLoading ? (
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/70">Loading PDF...</p>
          </div>
        ) : (
          <div className="book-container w-full max-w-6xl" style={{ transform: `scale(${zoom})` }}>
            <div
              ref={bookRef}
              className="book relative mx-auto"
              style={{
                width: '100%',
                maxWidth: '900px',
                aspectRatio: '2/1.4'
              }}
            >
              {/* Book spine/center binding */}
              <div
                className={`absolute left-1/2 top-0 bottom-0 w-8 -ml-4 z-20 ${getBindingClass()}`}
                style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' }}
              />

              {/* Pages */}
              <div className="relative w-full h-full flex">
                {/* Left page (or cover when closed) */}
                <div
                  className={`flex-1 relative ${settings.pageShadow ? 'page-shadow' : ''}`}
                  style={{
                    transformOrigin: 'right center',
                    transform: currentPage > 0 ? 'rotateY(0deg)' : 'rotateY(0deg)',
                    transition: `transform ${settings.flipSpeed}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
                  }}
                >
                  {currentPage === 0 ? (
                    // Front cover
                    <div
                      className={`absolute inset-0 rounded-l-lg overflow-hidden ${getCoverStyleClass()}`}
                      style={{ backgroundColor: settings.coverColor }}
                    >
                      <div className="h-full flex flex-col items-center justify-center p-8">
                        <BookOpen className="w-20 h-20 text-white/60 mb-6" />
                        <div className="w-24 h-1 bg-white/20 rounded-full mb-6" />
                        <p className="text-white/40 text-sm uppercase tracking-widest">Front Cover</p>
                      </div>
                    </div>
                  ) : (
                    // Left page content
                    <div className={`absolute inset-0 rounded-l-lg overflow-hidden ${getPaperTextureClass()}`}>
                      {pages[currentPage - 1] && (
                        <img
                          src={pages[currentPage - 1].imageUrl}
                          alt={`Page ${currentPage}`}
                          className="w-full h-full object-contain"
                          draggable={false}
                        />
                      )}
                      {settings.showPageNumbers && (
                        <div className="absolute bottom-4 left-4 text-xs text-black/40 font-medium">
                          {currentPage}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right page */}
                <div
                  className={`flex-1 relative ${settings.pageShadow ? 'page-shadow' : ''}`}
                >
                  {currentPage >= totalPages - 1 ? (
                    // Back cover
                    <div
                      className={`absolute inset-0 rounded-r-lg overflow-hidden ${getCoverStyleClass()}`}
                      style={{ backgroundColor: settings.coverColor }}
                    >
                      <div className="h-full flex flex-col items-center justify-center p-8">
                        <div className="w-24 h-1 bg-white/20 rounded-full mb-6" />
                        <p className="text-white/40 text-sm uppercase tracking-widest">Back Cover</p>
                      </div>
                    </div>
                  ) : (
                    // Right page content
                    <div className={`absolute inset-0 rounded-r-lg overflow-hidden ${getPaperTextureClass()}`}>
                      {pages[currentPage] && (
                        <img
                          src={pages[currentPage].imageUrl}
                          alt={`Page ${currentPage + 1}`}
                          className="w-full h-full object-contain"
                          draggable={false}
                        />
                      )}
                      {settings.showPageNumbers && (
                        <div className="absolute bottom-4 right-4 text-xs text-black/40 font-medium">
                          {currentPage + 1}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Page navigation areas */}
              <button
                onClick={prevPage}
                disabled={currentPage === 0 || isFlipping}
                className="absolute left-0 top-0 bottom-0 w-1/4 z-10 cursor-w-resize opacity-0 hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
              >
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
                  <ChevronLeft className="w-6 h-6 text-white" />
                </div>
              </button>

              <button
                onClick={nextPage}
                disabled={currentPage >= totalPages - 1 || isFlipping}
                className="absolute right-0 top-0 bottom-0 w-1/4 z-10 cursor-e-resize opacity-0 hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
              >
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
                  <ChevronRight className="w-6 h-6 text-white" />
                </div>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer / Controls */}
      {pdf && !isLoading && (
        <footer className="px-6 py-4 bg-black/30 backdrop-blur-md border-t border-white/5">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevPage}
              disabled={currentPage === 0 || isFlipping}
              className="text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Previous
            </Button>

            <div className="flex items-center gap-4">
              <span className="text-sm text-white/70">
                Page <span className="text-white font-medium">{Math.min(currentPage + 1, totalPages)}</span>
                {' - '}
                <span className="text-white font-medium">{Math.min(currentPage + 2, totalPages)}</span>
                {' of '}
                <span className="text-white font-medium">{totalPages}</span>
              </span>

              <div className="w-32 hidden sm:block">
                <Slider
                  value={[currentPage]}
                  onValueChange={([v]) => goToPage(v)}
                  max={totalPages - 1}
                  step={2}
                  className="py-2"
                />
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={nextPage}
              disabled={currentPage >= totalPages - 1 || isFlipping}
              className="text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30"
            >
              Next
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        </footer>
      )}
    </div>
  )
}

export default App
