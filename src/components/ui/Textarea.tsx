'use client'

import { type TextareaHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, hint, error, className, id, ...props }, ref) {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-xs font-semibold text-[#2A2018] tracking-tight">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full px-3.5 py-3 bg-white border-[1.5px] rounded-lg shadow-[2px_2px_0_#1A1410] text-sm text-[#2A2018] placeholder:text-[#6B5A4A] outline-none resize-none focus:shadow-[3px_3px_0_#1A1410] transition-shadow',
            error ? 'border-[#E54E4E]' : 'border-[#1A1410]',
            className
          )}
          {...props}
        />
        {(hint || error) && (
          <p className={cn('text-xs', error ? 'text-[#E54E4E]' : 'text-[#6B5A4A]')}>{error ?? hint}</p>
        )}
      </div>
    )
  }
)
