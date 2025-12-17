'use client'

import { useState, useEffect, ReactNode } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, AlertCircle } from 'lucide-react'

interface FieldOption {
    value: string;
    label: string;
}

interface ViewField {
    key: string;
    label: string;
    render?: (value: any, data: any) => ReactNode;
}

interface EditField {
    key: string;
    label: string;
    type?: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'file-upload';
    placeholder?: string;
    required?: boolean;
    options?: FieldOption[];
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
}

interface ViewModalProps {
    isOpen: boolean;
    onClose: (open: boolean) => void;
    title: string;
    data?: Record<string, any>;
    fields?: ViewField[];
}

export function ViewModal({
    isOpen,
    onClose,
    title,
    data = {},
    fields = []
}: ViewModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        View detailed information
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {fields.map((field) => (
                        <div key={field.key} className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right font-medium">
                                {field.label}:
                            </Label>
                            <div className="col-span-3">
                                {field.render ?
                                    field.render(data[field.key], data) :
                                    (data[field.key] || 'N/A')
                                }
                            </div>
                        </div>
                    ))}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onClose(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

interface EditModalProps {
    isOpen: boolean;
    onClose: (open: boolean) => void;
    title: string;
    data?: Record<string, any>;
    fields?: EditField[];
    onSave?: (values: Record<string, any>) => void;
    loading?: boolean;
}

export function EditModal({
    isOpen,
    onClose,
    title,
    data = {},
    fields = [],
    onSave,
    loading = false
}: EditModalProps) {
    const [formValues, setFormValues] = useState<Record<string, any>>(data)
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
    const [showErrors, setShowErrors] = useState(false)

    useEffect(() => {
        setFormValues(data)
        setValidationErrors({})
        setShowErrors(false)
    }, [data, isOpen])

    const validateForm = (values: Record<string, any>) => {
        const errors: Record<string, string> = {}

        fields.forEach(field => {
            const value = values[field.key]
            const isEmpty =
                value === undefined ||
                value === null ||
                (typeof value === 'string' && value.trim() === '')

            const isRequired = field.required !== false

            if (isRequired && isEmpty) {
                errors[field.key] = `${field.label} is required`
                return
            }

            if (isEmpty) return

            if (field.type === 'number') {
                const numValue = parseFloat(value)
                if (isNaN(numValue)) {
                    errors[field.key] = `${field.label} must be a valid number`
                } else {
                    if (field.min !== undefined && numValue < field.min) {
                        errors[field.key] = `${field.label} must be at least ${field.min}`
                    }
                    if (field.max !== undefined && numValue > field.max) {
                        errors[field.key] = `${field.label} must not exceed ${field.max}`
                    }
                }
            }
        })

        return errors
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        const values = { ...formValues }
        const errors = validateForm(values)
        setValidationErrors(errors)
        setShowErrors(true)

        if (Object.keys(errors).length > 0) {
            return
        }

        onSave?.(values)
    }

    const handleInputChange = (key: string, value: any) => {
        setFormValues(prev => ({
            ...prev,
            [key]: value
        }))

        if (validationErrors[key]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[key]
                return newErrors
            })
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        Make changes and click save when you're done. <span className="text-red-500">*</span> indicates required fields.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {fields.map((field) => {
                            const isRequired = field.required !== false
                            const hasError = showErrors && validationErrors[field.key]

                            return (
                                <div key={field.key} className="grid grid-cols-4 items-start gap-4">
                                    <Label htmlFor={field.key} className="text-right pt-2">
                                        {field.label}
                                        {isRequired && <span className="text-red-500 ml-1">*</span>}
                                    </Label>
                                    <div className="col-span-3 space-y-2">
                                        {field.type === 'textarea' ? (
                                            <textarea
                                                id={field.key}
                                                name={field.key}
                                                value={formValues[field.key] || ''}
                                                onChange={(e) => handleInputChange(field.key, e.target.value)}
                                                placeholder={field.placeholder}
                                                className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${hasError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                                disabled={loading}
                                                required={isRequired}
                                            />
                                        ) : field.type === 'select' ? (
                                            <select
                                                id={field.key}
                                                name={field.key}
                                                value={formValues[field.key] || ''}
                                                onChange={(e) => handleInputChange(field.key, e.target.value)}
                                                className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${hasError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                                disabled={loading}
                                                required={isRequired}
                                            >
                                                <option value="">Select {field.label}</option>
                                                {field.options?.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <Input
                                                id={field.key}
                                                name={field.key}
                                                type={field.type || 'text'}
                                                value={formValues[field.key] || ''}
                                                onChange={(e) => handleInputChange(field.key, e.target.value)}
                                                placeholder={field.placeholder}
                                                disabled={loading}
                                                required={isRequired}
                                                min={field.min}
                                                max={field.max}
                                                className={hasError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                            />
                                        )}

                                        {hasError && (
                                            <div className="flex items-center gap-2 text-red-600 text-sm">
                                                <AlertCircle className="w-4 h-4" />
                                                {validationErrors[field.key]}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onClose(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

interface DeleteModalProps {
    isOpen: boolean;
    onClose: (open: boolean) => void;
    title: string;
    message: string;
    onConfirm?: () => void;
    loading?: boolean;
}

export function DeleteModal({
    isOpen,
    onClose,
    title,
    message,
    onConfirm,
    loading = false
}: DeleteModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                        {title}
                    </DialogTitle>
                    <DialogDescription>
                        {message}
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
                    <p className="text-sm text-red-800">
                        <strong>Warning:</strong> This action cannot be undone.
                    </p>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onClose(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
