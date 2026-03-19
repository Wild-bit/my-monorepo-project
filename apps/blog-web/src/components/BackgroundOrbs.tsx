export default function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div className="absolute w-[500px] h-[500px] rounded-full bg-[#7c3aed] blur-[100px] opacity-30 -top-[10%] -left-[10%] animate-float" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-[#ec4899] blur-[100px] opacity-30 bottom-[10%] -right-[5%] animate-float-slow [animation-delay:-7s]" />
      <div className="absolute w-[350px] h-[350px] rounded-full bg-[#3b82f6] blur-[100px] opacity-30 top-[50%] left-[40%] animate-float-slower [animation-delay:-14s]" />
    </div>
  );
}
