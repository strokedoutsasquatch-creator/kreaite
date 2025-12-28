import { Globe, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSupportedLocales, useLocaleContext } from '@/lib/hooks/useLocale';
import { Skeleton } from '@/components/ui/skeleton';

export function LanguageSwitcher() {
  const { locale, setLocale, localeConfig } = useLocaleContext();
  const { data: localesData, isLoading } = useSupportedLocales();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <Skeleton className="h-8 w-24" />
      </div>
    );
  }

  const languages = localesData?.languages || [];
  const currentLanguage = languages.find(l => l.code === locale);
  const isRTL = localeConfig?.direction === 'rtl';

  return (
    <div className="flex items-center gap-2" data-testid="language-switcher">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={locale} onValueChange={setLocale}>
        <SelectTrigger 
          className="w-auto min-w-[120px] border-zinc-800 bg-background hover-elevate"
          data-testid="language-select-trigger"
        >
          <SelectValue>
            <span className="flex items-center gap-2">
              {currentLanguage?.nativeName || locale}
              {isRTL && <span className="text-xs text-primary">RTL</span>}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent 
          className="bg-zinc-900 border-zinc-800"
          data-testid="language-select-content"
        >
          {languages.map((lang) => (
            <SelectItem 
              key={lang.code} 
              value={lang.code}
              className="hover:bg-zinc-800 focus:bg-zinc-800"
              data-testid={`language-option-${lang.code}`}
            >
              <span className="flex items-center gap-2">
                <span>{lang.nativeName}</span>
                {lang.code !== lang.name && (
                  <span className="text-xs text-muted-foreground">({lang.name})</span>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default LanguageSwitcher;
