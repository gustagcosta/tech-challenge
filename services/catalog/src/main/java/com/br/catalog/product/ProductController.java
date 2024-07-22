package com.br.catalog.product;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    @GetMapping
    public Iterable<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @GetMapping("/{id}")
    public Product getProductById(@PathVariable Long id) {
        return productRepository.findById(id).orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
    }

    @Transactional
    @PostMapping
    public Product createProduct(@RequestBody Product product) {
        return productRepository.save(product);
    }

    @Transactional
    @PutMapping("/{id}")
    public Product updateProduct(@PathVariable Long id, @RequestBody Product productDetails) {
        Product product = productRepository.findById(id).orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        product.setName(productDetails.getName());
        product.setDescription(productDetails.getDescription());
        product.setPrice(productDetails.getPrice());

        return productRepository.save(product);
    }

    @Transactional
    @DeleteMapping("/{id}")
    public void deleteProduct(@PathVariable Long id) {
        Product product = productRepository.findById(id).orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        productRepository.delete(product);
    }

    @PostMapping("/validate")
    public ResponseEntity<String> validateProducts(@RequestBody List<Long> productIds) {
        for (Long productId : productIds) {
            if (!productRepository.existsById(productId)) {
                return ResponseEntity.badRequest().body("Invalid product ID found: " + productId);
            }
        }

        return ResponseEntity.ok("All products are valid");
    }
}
