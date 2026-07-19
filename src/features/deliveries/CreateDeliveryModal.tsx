import { useEffect, useState, type FormEvent } from 'react'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useAllowedDistricts } from '@/lib/api/queries/useAllowedDistricts'
import { useCreateDelivery } from '@/lib/api/queries/useDeliveryActions'
import { APP_CONFIG } from '@/config/app.config'

interface Props {
    open: boolean
    onClose: () => void
}

const inputCls =
    'w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--foreground-muted))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))]'

const labelCls = 'mb-1 block text-xs font-medium text-[hsl(var(--foreground-muted))]'

export default function CreateDeliveryModal({ open, onClose }: Props) {
    const [lat, setLat] = useState(String(APP_CONFIG.map.center[0]))
    const [lng, setLng] = useState(String(APP_CONFIG.map.center[1]))
    const [districtId, setDistrictId] = useState('')
    const [eta, setEta] = useState('')

    const districts = useAllowedDistricts()
    const create = useCreateDelivery(() => onClose())

    useEffect(() => {
        if (open) {
            setLat(String(APP_CONFIG.map.center[0]))
            setLng(String(APP_CONFIG.map.center[1]))
            setDistrictId('')
            setEta('')
        }
    }, [open])

    function handleSubmit(e: FormEvent) {
        e.preventDefault()
        const latNum = parseFloat(lat)
        const lngNum = parseFloat(lng)
        if (isNaN(latNum) || isNaN(lngNum)) return
        create.mutate({
            lat: latNum,
            lng: lngNum,
            districtId: districtId || undefined,
            expectedEta: eta ? new Date(eta).toISOString() : undefined,
        })
    }

    return (
        <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
            <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-sm">
                <SheetHeader className="border-b border-[hsl(var(--border))] px-6 py-5">
                    <SheetTitle className="text-base">New Delivery</SheetTitle>
                    <SheetDescription className="text-xs">
                        Enter the pickup coordinates. District is auto-detected from the location if not specified.
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
                    <div>
                        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))]">
                            Coordinates
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelCls}>Latitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={lat}
                                    onChange={(e) => setLat(e.target.value)}
                                    required
                                    placeholder="33.5138"
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Longitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={lng}
                                    onChange={(e) => setLng(e.target.value)}
                                    required
                                    placeholder="36.2765"
                                    className={inputCls}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className={labelCls}>
                            District{' '}
                            <span className="text-[hsl(var(--foreground-subtle,var(--foreground-muted)))]">
                                (optional — auto-detected if empty)
                            </span>
                        </label>
                        <select
                            value={districtId}
                            onChange={(e) => setDistrictId(e.target.value)}
                            className={inputCls}
                        >
                            <option value="">Auto-detect from coordinates</option>
                            {districts.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className={labelCls}>
                            Expected ETA{' '}
                            <span className="text-[hsl(var(--foreground-subtle,var(--foreground-muted)))]">
                                (optional)
                            </span>
                        </label>
                        <input
                            type="datetime-local"
                            value={eta}
                            onChange={(e) => setEta(e.target.value)}
                            className={inputCls}
                        />
                    </div>

                    <div className="mt-auto flex items-center justify-end gap-3 border-t border-[hsl(var(--border))] pt-5">
                        <Button variant="outline" type="button" onClick={onClose} size="sm">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={create.isPending} size="sm">
                            {create.isPending && <Loader2 size={13} className="mr-1.5 animate-spin" />}
                            Create Delivery
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    )
}
