export interface IRepository<T> {
    getMany?() : Promise<T[]>
    getBy?(args: unknown) : Promise<T>
    create?(args: unknown) : Promise<T>
    updateBy?(updateData: unknown, args: unknown) : Promise<T>
    deleteBy?(args: unknown) : Promise<boolean>
}