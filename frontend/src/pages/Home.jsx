export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  return (
    <div className={`min-h-screen font-sans ${isDarkMode ? 'bg-[#141414] text-white' : 'bg-white text-black'} transition-colors duration-300`}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-12">
          <h1 className="text-3xl font-bold tracking-tighter">RAÚM</h1>
          <nav className="hidden md:flex items-center gap-8 text-[11px] font-medium tracking-widest uppercase">
            <a href="#" className="hover:opacity-60 transition-opacity">Shop</a>
            <a href="#" className="hover:opacity-60 transition-opacity">Collections</a>
            <a href="#" className="hover:opacity-60 transition-opacity">About</a>
          </nav>
        </div>
        
        <div className="flex items-center gap-8 text-[11px] font-medium tracking-widest uppercase">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="hover:opacity-60 transition-opacity cursor-pointer"
          >
            [{isDarkMode ? <span className="opacity-40">DARK / </span> : 'DARK / '}
             {isDarkMode ? 'LIGHT' : <span className="opacity-40">LIGHT</span>}]
          </button>
          <button className="flex items-center gap-2 hover:opacity-60 transition-opacity">
            <span>Search</span>
          </button>
          <button className="hover:opacity-60 transition-opacity">Account</button>
          <button className="hover:opacity-60 transition-opacity">Bag</button>
        </div>
      </header>

      {/* Hero Title */}
      <section className="px-6 py-12">
        <h2 className="text-2xl font-medium tracking-tight uppercase">All Clothing</h2>
      </section>

      {/* Filters */}
      <section className="px-6 py-4 border-t border-b border-white/10 flex items-center justify-between text-[11px] font-medium tracking-widest uppercase">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
          <a href="#" className="underline underline-offset-4">All</a>
          <span className="opacity-20">|</span>
          <a href="#" className="opacity-60 hover:opacity-100">Outerwear</a>
          <span className="opacity-20">|</span>
          <a href="#" className="opacity-60 hover:opacity-100">Knitwear</a>
          <span className="opacity-20">|</span>
          <a href="#" className="opacity-60 hover:opacity-100">Tops</a>
          <span className="opacity-20">|</span>
          <a href="#" className="opacity-60 hover:opacity-100">Bottoms</a>
          <span className="opacity-20">|</span>
          <a href="#" className="opacity-60 hover:opacity-100">Dresses</a>
          <span className="opacity-20">|</span>
          <a href="#" className="opacity-60 hover:opacity-100">Jumpsuits</a>
          <span className="opacity-20">|</span>
          <a href="#" className="opacity-60 hover:opacity-100">Loungewear</a>
        </div>
        <button className="flex items-center gap-1 hover:opacity-60 transition-opacity">
          Filter & Sort <Plus size={14} />
        </button>
      </section>

      {/* Product Grid */}
      <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-white/10">
        {PRODUCTS.map((product) => (
          <div key={product.id} className="group border-r border-b border-white/10 last:border-r-0 lg:[&:nth-child(4n)]:border-r-0 relative cursor-pointer">
            <div className="aspect-[3/4] overflow-hidden bg-[#1a1a1a]">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              {product.isNew && (
                <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md px-2 py-1 text-[9px] font-bold tracking-widest uppercase border border-white/20">
                  New in
                </div>
              )}
            </div>
            <div className="p-4 flex justify-between items-start gap-4">
              <h3 className="text-[11px] font-medium tracking-widest uppercase leading-tight max-w-[70%]">
                {product.name}
              </h3>
              <span className="text-[11px] font-medium tracking-widest">
                {product.price}
              </span>
            </div>
          </div>
        ))}
      </main>

      {/* Footer Pagination */}
      <footer className="py-20 flex flex-col items-center gap-8">
        <button className="px-12 py-3 border border-white/20 text-[11px] font-medium tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-all duration-300">
          View More Items
        </button>
        
        <div className="flex items-center gap-6 text-[11px] font-medium tracking-widest">
          <ChevronLeft size={16} className="opacity-40 cursor-not-allowed" />
          <div className="flex items-center gap-4">
            <span className="underline underline-offset-4">1</span>
            <span className="opacity-40 hover:opacity-100 cursor-pointer">2</span>
            <span className="opacity-40 hover:opacity-100 cursor-pointer">3</span>
            <span className="opacity-40">...</span>
            <span className="opacity-40 hover:opacity-100 cursor-pointer">7</span>
          </div>
          <ChevronRight size={16} className="opacity-100 cursor-pointer hover:opacity-60" />
        </div>
      </footer>
    </div>
  );
}