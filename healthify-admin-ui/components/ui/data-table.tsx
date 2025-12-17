'use client'

import { useState, ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import {
    Search,
    Filter,
    RefreshCw,
    Plus,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    Eye,
    Edit,
    Trash2,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    X,
    ChevronsLeft,
    ChevronsRight
} from 'lucide-react'

interface Column {
    key: string;
    label: string;
    sortable?: boolean;
    render?: (value: any, item: any) => ReactNode;
}

interface FilterOption {
    value: string;
    label: string;
}

interface AvailableFilter {
    key: string;
    label: string;
    type: 'select' | 'text' | 'number' | 'date';
    options?: FilterOption[];
    placeholder?: string;
}

interface DataTableProps {
    title: ReactNode;
    description?: string;
    data?: any[];
    columns?: Column[];
    searchPlaceholder?: string;
    onAdd?: () => void;
    onView?: (item: any) => void;
    onEdit?: (item: any) => void;
    onDelete?: (item: any) => void;
    onRefresh?: () => Promise<void> | void;
    loading?: boolean;
    searchTerm?: string;
    onSearchChange?: (value: string) => void;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    onSort?: (column: string) => void;
    currentPage?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
    totalItems?: number;
    itemsPerPage?: number;
    onItemsPerPageChange?: (items: number) => void;
    availableFilters?: AvailableFilter[];
    activeFilters?: Record<string, any>;
    onFilterChange?: (key: string, value: any) => void;
    onClearFilters?: () => void;
}

export function DataTable({
    title,
    description,
    data = [],
    columns = [],
    searchPlaceholder = "Search...",
    onAdd,
    onView,
    onEdit,
    onDelete,
    onRefresh,
    loading = false,
    searchTerm,
    onSearchChange,
    sortBy,
    sortOrder,
    onSort,
    currentPage = 1,
    totalPages = 1,
    onPageChange,
    totalItems = 0,
    itemsPerPage = 10,
    onItemsPerPageChange,
    availableFilters = [],
    activeFilters = {},
    onFilterChange,
    onClearFilters
}: DataTableProps) {
    const [refreshing, setRefreshing] = useState(false)
    const [showFilters, setShowFilters] = useState(false)

    const handleRefresh = async () => {
        setRefreshing(true)
        if (onRefresh) {
            await onRefresh()
        }
        setRefreshing(false)
    }

    const getSortIcon = (columnKey: string) => {
        if (sortBy !== columnKey) return <ArrowUpDown className="w-4 h-4" />
        return sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
    }

    const startItem = ((currentPage - 1) * itemsPerPage) + 1
    const endItem = Math.min(currentPage * itemsPerPage, totalItems)

    const hasActiveFilters = Object.keys(activeFilters || {}).some(key =>
        activeFilters[key] !== null && activeFilters[key] !== undefined && activeFilters[key] !== '' && activeFilters[key] !== 'all'
    )

    const itemsPerPageOptions = [5, 10, 20, 50, 100]

    const generatePaginationNumbers = (): (number | string)[] => {
        const delta = 2
        const pages: (number | string)[] = []

        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            pages.push(1)

            if (currentPage > delta + 2) {
                pages.push('...')
            }

            const start = Math.max(2, currentPage - delta)
            const end = Math.min(totalPages - 1, currentPage + delta)

            for (let i = start; i <= end; i++) {
                pages.push(i)
            }

            if (currentPage < totalPages - delta - 1) {
                pages.push('...')
            }

            if (totalPages > 1) {
                pages.push(totalPages)
            }
        }

        return pages
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            {title}
                        </CardTitle>
                        {description && (
                            <CardDescription>
                                {description}
                            </CardDescription>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handleRefresh}
                            variant="outline"
                            size="sm"
                            disabled={refreshing || loading}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>

                        {availableFilters.length > 0 && (
                            <Button
                                onClick={() => setShowFilters(!showFilters)}
                                variant={hasActiveFilters ? "default" : "outline"}
                                size="sm"
                                className="flex items-center gap-2"
                            >
                                <Filter className="w-4 h-4" />
                                Filters
                                {hasActiveFilters && (
                                    <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                                        {Object.keys(activeFilters).filter(key =>
                                            activeFilters[key] !== null && activeFilters[key] !== undefined && activeFilters[key] !== '' && activeFilters[key] !== 'all'
                                        ).length}
                                    </Badge>
                                )}
                            </Button>
                        )}

                        {onAdd && (
                            <Button
                                onClick={onAdd}
                                size="sm"
                                className="flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add New
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchTerm || ''}
                            onChange={(e) => onSearchChange?.(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {showFilters && availableFilters.length > 0 && (
                        <div className="p-4 bg-gray-50 rounded-lg border">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-sm">Advanced Filters</h4>
                                <div className="flex items-center gap-2">
                                    {hasActiveFilters && (
                                        <Button
                                            onClick={onClearFilters}
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs"
                                        >
                                            <X className="w-3 h-3 mr-1" />
                                            Clear All
                                        </Button>
                                    )}
                                    <Button
                                        onClick={() => setShowFilters(false)}
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs"
                                    >
                                        <X className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {availableFilters.map((filter) => (
                                    <div key={filter.key} className="space-y-1">
                                        <label className="text-xs font-medium text-gray-600">
                                            {filter.label}
                                        </label>
                                        {filter.type === 'select' ? (
                                            <Select
                                                value={activeFilters?.[filter.key] || 'all'}
                                                onValueChange={(value) => onFilterChange?.(filter.key, value === 'all' ? '' : value)}
                                            >
                                                <SelectTrigger className="h-8 text-sm">
                                                    <SelectValue placeholder={filter.placeholder || 'Select...'} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All</SelectItem>
                                                    {filter.options?.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : filter.type === 'date' ? (
                                            <Input
                                                type="date"
                                                value={activeFilters?.[filter.key] || ''}
                                                onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                                                className="h-8 text-sm"
                                            />
                                        ) : filter.type === 'number' ? (
                                            <Input
                                                type="number"
                                                placeholder={filter.placeholder}
                                                value={activeFilters?.[filter.key] || ''}
                                                onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                                                className="h-8 text-sm"
                                            />
                                        ) : (
                                            <Input
                                                type="text"
                                                placeholder={filter.placeholder}
                                                value={activeFilters?.[filter.key] || ''}
                                                onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                                                className="h-8 text-sm"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {hasActiveFilters && (
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(activeFilters || {}).map(([key, value]) => {
                                if (!value || value === '') return null
                                const filter = availableFilters.find(f => f.key === key)
                                const displayValue = filter?.type === 'select'
                                    ? filter.options?.find(opt => opt.value === value)?.label || value
                                    : value

                                return (
                                    <Badge key={key} variant="secondary" className="flex items-center gap-1">
                                        <span className="text-xs">{filter?.label}: {displayValue}</span>
                                        <Button
                                            onClick={() => onFilterChange?.(key, '')}
                                            variant="ghost"
                                            size="sm"
                                            className="h-auto p-0 w-4 h-4 hover:bg-transparent"
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </Badge>
                                )
                            })}
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">#</TableHead>
                                {columns.map((column) => (
                                    <TableHead
                                        key={column.key}
                                        className={column.sortable ? 'cursor-pointer hover:bg-gray-50' : ''}
                                        onClick={column.sortable ? () => onSort?.(column.key) : undefined}
                                    >
                                        <div className="flex items-center gap-2">
                                            {column.label}
                                            {column.sortable && getSortIcon(column.key)}
                                        </div>
                                    </TableHead>
                                ))}
                                <TableHead className="w-[50px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length + 2} className="text-center py-8">
                                        <div className="flex items-center justify-center gap-2">
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            Loading...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length + 2} className="text-center py-8 text-gray-500">
                                        {searchTerm || hasActiveFilters ? 'No items found matching your criteria.' : 'No items found.'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((item, index) => (
                                    <TableRow key={item.id || item._id}>
                                        <TableCell className="font-medium">
                                            {startItem + index}
                                        </TableCell>
                                        {columns.map((column) => (
                                            <TableCell key={column.key}>
                                                {column.render ? column.render(item[column.key], item) : item[column.key]}
                                            </TableCell>
                                        ))}
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {onView && (
                                                        <DropdownMenuItem onClick={() => onView(item)}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                    )}
                                                    {onEdit && (
                                                        <DropdownMenuItem onClick={() => onEdit(item)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                    )}
                                                    {onDelete && (
                                                        <DropdownMenuItem
                                                            onClick={() => onDelete(item)}
                                                            className="text-red-600 hover:text-red-700"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div>
                            Showing {totalItems > 0 ? startItem : 0} to {endItem} of {totalItems} items
                        </div>

                        {onItemsPerPageChange && (
                            <div className="flex items-center gap-2">
                                <span>Items per page:</span>
                                <Select
                                    value={itemsPerPage.toString()}
                                    onValueChange={(value) => onItemsPerPageChange?.(parseInt(value))}
                                >
                                    <SelectTrigger className="w-20 h-8">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {itemsPerPageOptions.map((option) => (
                                            <SelectItem key={option} value={option.toString()}>
                                                {option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onPageChange?.(1)}
                                disabled={currentPage <= 1}
                                className="w-8 h-8 p-0"
                            >
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onPageChange?.(currentPage - 1)}
                                disabled={currentPage <= 1}
                                className="w-8 h-8 p-0"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <div className="flex items-center gap-1">
                                {generatePaginationNumbers().map((pageNum, index) =>
                                    pageNum === '...' ? (
                                        <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                                            ...
                                        </span>
                                    ) : (
                                        <Button
                                            key={pageNum}
                                            variant={currentPage === pageNum ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => onPageChange?.(pageNum as number)}
                                            className="w-8 h-8 p-0"
                                        >
                                            {pageNum}
                                        </Button>
                                    )
                                )}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onPageChange?.(currentPage + 1)}
                                disabled={currentPage >= totalPages}
                                className="w-8 h-8 p-0"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onPageChange?.(totalPages)}
                                disabled={currentPage >= totalPages}
                                className="w-8 h-8 p-0"
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
