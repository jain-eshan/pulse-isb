type Props = {
  emoji: string;
  title: string;
  desc: string;
  cta?: React.ReactNode;
};

export default function EmptyState({ emoji, title, desc, cta }: Props) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center">
      <div className="text-5xl mb-3">{emoji}</div>
      <p className="font-bold text-gray-900 mb-1">{title}</p>
      <p className="text-sm text-gray-500 mb-5 leading-relaxed">{desc}</p>
      {cta}
    </div>
  );
}
