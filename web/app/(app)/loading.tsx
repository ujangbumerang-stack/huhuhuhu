export default function Loading() {
    return (
        <div className="w-full h-full min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <div 
                className="w-10 h-10 border-4 border-slate-100 rounded-full animate-spin"
                style={{ borderTopColor: 'var(--community-primary, #0B1E26)' }}
            />
            <span className="text-xs font-bold text-slate-400 animate-pulse tracking-wide">Memuat...</span>
        </div>
    );
}
