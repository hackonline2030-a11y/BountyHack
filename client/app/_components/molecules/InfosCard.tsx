type InfosCardProps = {
    sep?: boolean;
    data: {label: string, info: string};
}

export const InfosCard = ({ sep = true, data }: InfosCardProps) => {

    if (!data) return null;
    const { label, info } = data;
    return (
        <div className="bg-white rounded-md p-4 w-full flex flex-col">
            <div className={`flex flex-col gap-y-2 ${sep ? 'infos-card-sep' : ''}`}>
                {label ? <h2 className="text-sm font-bold uppercase text-gray-500">{label}</h2> : null}

                {info ? <p className="text-sm font-bold text-black">{info}</p> : null}
            </div>
        </div>
    )
}