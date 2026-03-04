'use client'

import { useMemo } from 'react'

interface ClinicCardData {
    clinic: string
    label: string
    color: string
    icon: string
    recordCount: number
    totalAmount: number
}

interface ClinicCardsProps {
    selectedClinic: string
    onSelectClinic: (clinic: string) => void
    data: Array<{ clinic: string; total?: number; amount?: number }>
    type: 'revenue' | 'expenses'
}

const CLINIC_CONFIG = [
    { clinic: 'San', label: 'Nha khoa San', color: '#3B82F6', icon: 'S' },
    { clinic: 'Teennie', label: 'Teennie', color: '#F59E0B', icon: 'T' },
    { clinic: 'Implant', label: 'Thế giới Implant', color: '#10B981', icon: 'I' },
]

function formatTotal(amount: number): string {
    if (amount >= 1e9) return `${(amount / 1e9).toFixed(2)} tỷ`
    if (amount >= 1e6) return `${(amount / 1e6).toFixed(1)} tr`
    return amount.toLocaleString('vi-VN')
}

export function ClinicCards({ selectedClinic, onSelectClinic, data, type }: ClinicCardsProps) {
    const cardData = useMemo(() => {
        return CLINIC_CONFIG.map(cfg => {
            const clinicRows = data.filter(r => r.clinic === cfg.clinic)
            const total = clinicRows.reduce((sum, r) => {
                return sum + (type === 'revenue' ? (r.total || 0) : (r.amount || 0))
            }, 0)
            return {
                ...cfg,
                recordCount: clinicRows.length,
                totalAmount: total,
            }
        })
    }, [data, type])

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
            {cardData.map(card => {
                const isSelected = selectedClinic === card.clinic

                return (
                    <button
                        key={card.clinic}
                        onClick={() => onSelectClinic(card.clinic === selectedClinic ? '' : card.clinic)}
                        style={{
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--space-3)',
                            padding: 'var(--space-4)',
                            borderRadius: 'var(--radius-lg)',
                            border: `2px solid ${isSelected ? card.color : 'var(--border)'}`,
                            background: 'var(--bg-card)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s ease',
                            boxShadow: isSelected ? `0 0 0 1px ${card.color}20` : 'none',
                        }}
                    >
                        {/* Badge "Đang chọn" */}
                        {isSelected && (
                            <span style={{
                                position: 'absolute',
                                top: 'var(--space-3)',
                                right: 'var(--space-3)',
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-full)',
                                background: card.color,
                                color: 'white',
                                fontSize: '10px',
                                fontWeight: 'var(--weight-semibold)',
                            }}>
                                Đang chọn
                            </span>
                        )}

                        {/* Icon + Name */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                borderRadius: 'var(--radius-md)',
                                background: `${card.color}20`,
                                color: card.color,
                                fontSize: 'var(--text-sm)',
                                fontWeight: 'var(--weight-bold)',
                            }}>
                                {card.icon}
                            </span>
                            <span style={{
                                fontSize: 'var(--text-base)',
                                fontWeight: 'var(--weight-semibold)',
                                color: 'var(--text-primary)',
                            }}>
                                {card.label}
                            </span>
                        </div>

                        {/* Stats */}
                        <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
                            <div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Bản ghi
                                </div>
                                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>
                                    {card.recordCount.toLocaleString('vi-VN')}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {type === 'revenue' ? 'Doanh thu' : 'Chi phí'}
                                </div>
                                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>
                                    {formatTotal(card.totalAmount)}
                                </div>
                            </div>
                        </div>
                    </button>
                )
            })}
        </div>
    )
}
