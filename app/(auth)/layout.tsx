import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Einstein's famous quote about imagination, split word by word
  const quoteWords = [
    "Imagination",
    "is",
    "more",
    "important",
    "than",
    "knowledge.",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#000000]">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 max-w-5xl w-full">
          
          {/* Left Side - Hero Image (Desktop Only) */}
          <div className="hidden lg:flex flex-1 items-center justify-center max-w-md">
            <div className="relative w-80 h-[500px]">
              {/* Decorative phone mockup with sample images */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Background photo stack effect */}
                  <div className="absolute -left-8 -top-4 w-48 h-64 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl rotate-[-12deg] opacity-80" />
                  <div className="absolute -right-6 top-8 w-44 h-60 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl rotate-[8deg] opacity-80" />
                  
                  {/* Main phone frame */}
                  <div className="relative w-56 h-[400px] bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-[2.5rem] border-4 border-zinc-700 shadow-2xl overflow-hidden">
                    {/* Phone screen */}
                    <div className="absolute inset-2 bg-black rounded-[2rem] overflow-hidden">
                      {/* Sample content - gradient placeholder */}
                      <div className="w-full h-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center">
                        <div className="text-white text-center">
                          <Image 
                            src="/Instagram_Glyph_White.png" 
                            alt="InstaClone" 
                            width={100} 
                            height={100}
                            className="mx-auto mb-4 drop-shadow-lg"
                          />
                          <p className="text-xl font-instagram drop-shadow-lg">InstaClone</p>
                        </div>
                      </div>
                    </div>
                    {/* Phone notch */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-6 bg-black rounded-full" />
                  </div>
                  
                  {/* Floating elements */}
                  <div className="absolute -top-8 -right-4 bg-white rounded-full p-2 shadow-lg">
                    <span className="text-2xl">❤️</span>
                  </div>
                  <div className="absolute bottom-20 -left-12 bg-white rounded-full p-2 shadow-lg">
                    <span className="text-2xl">🔥</span>
                  </div>
                  <div className="absolute top-32 -right-10 bg-white rounded-full p-2 shadow-lg">
                    <span className="text-2xl">💬</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Auth Form */}
          <div className="w-full max-w-sm">
            {children}
          </div>
        </div>
      </div>

      {/* Footer - Mobile Only */}
      <footer className="md:hidden py-6 px-4 text-center">
        <p className="text-xs text-zinc-500">
          © 2025 InstaClone · From Captain Cursor
        </p>
      </footer>

      {/* Footer - Desktop */}
      <footer className="hidden md:block py-6 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-zinc-500 mb-4">
            {quoteWords.map((word, index) => (
              <span key={index} className="italic">
                {word}
              </span>
            ))}
            <span className="not-italic">— Einstein</span>
          </div>
          <p className="text-xs text-zinc-500 text-center">
            © 2025 InstaClone · From Captain Cursor
          </p>
        </div>
      </footer>
    </div>
  );
}
