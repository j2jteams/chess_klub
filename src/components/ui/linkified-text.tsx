interface LinkifiedTextProps {
  children: string;
  className?: string;
}

export function LinkifiedText({ children, className }: LinkifiedTextProps) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = children.split(urlRegex);
  
  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (urlRegex.test(part)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all"
            >
              {part}
            </a>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}