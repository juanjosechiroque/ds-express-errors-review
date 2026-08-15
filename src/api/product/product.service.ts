import * as productRepository from "./product.repository.js";
import { toProductDto } from "./product.mapper.js";
import type { CreateProductInput, ListProductsInput, UpdateProductInput } from "./product.types.js";
import { Errors } from "ds-express-errors";

export async function getProducts({
    cursor,
    limit = 10,
    status,
    isFeatured,
}: ListProductsInput = {}) {
    const { items, hasMore, nextCursor } = await productRepository.findProducts({
        cursor,
        limit,
        status,
        isFeatured,
    });
    return {
        items: items.map(toProductDto),
        pagination: { limit, nextCursor, hasMore },
    };
}

export async function getProductById(id: string) {
    const result = await productRepository.findProductById(id);
    if (!result) throw Errors.NotFound("Product not found");
    return toProductDto(result);
}

export async function createProduct(input: CreateProductInput) {
    const result = await productRepository.createProduct(input);
    return toProductDto(result);
}

export async function updateProduct({ id, ...fields }: UpdateProductInput & { id: string }) {
    const update = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
    const result = await productRepository.updateProductById(id, update);
    if (!result) throw Errors.NotFound("Product not found");
    return toProductDto(result);
}

export async function deleteProduct(productId: string) {
    const result = await productRepository.deleteProductIfNotActive(productId);
    if (!result) {
        const exists = await productRepository.findProductById(productId);
        if (!exists) throw Errors.NotFound("Product not found");
        throw Errors.BadRequest("Active products must be archived before deletion");
    }
    return toProductDto(result);
}
