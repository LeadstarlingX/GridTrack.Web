interface DevDisabledProps {
    title: string
}

export default function DevDisabled({ title }: DevDisabledProps) {
    return <h1 className="p-6 text-2xl font-semibold">{title}</h1>
}
