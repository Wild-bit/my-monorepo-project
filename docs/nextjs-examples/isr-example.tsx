// ISR 完整示例 - 电商产品页
import type { GetStaticProps, GetStaticPaths } from 'next'

interface Product {
  id: string
  name: string
  price: number
  stock: number
  description: string
  image: string
}

interface ProductPageProps {
  product: Product
}

// 指定要预生成的产品页面
export const getStaticPaths: GetStaticPaths = async () => {
  // 只预生成热门产品
  const popularProducts = await fetchPopularProducts()

  const paths = popularProducts.map(product => ({
    params: { id: product.id },
  }))

  return {
    paths,
    // 其他产品首次访问时生成，然后缓存
    fallback: 'blocking',
  }
}

// 构建时生成，之后每 60 秒重新验证
export const getStaticProps: GetStaticProps<ProductPageProps> = async ({ params }) => {
  const productId = params?.id as string

  // 获取产品数据
  const product = await fetchProduct(productId)

  if (!product) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      product,
    },
    // 关键：每 60 秒重新验证一次
    // 用户仍然会看到缓存的页面（快！），但后台会更新
    revalidate: 60,
  }
}

export default function ProductPage({ product }: ProductPageProps) {
  return (
    <div>
      <img src={product.image} alt={product.name} />
      <h1>{product.name}</h1>
      <p className="price">¥{product.price}</p>
      <p className="stock">
        库存：{product.stock > 0 ? `${product.stock} 件` : '缺货'}
      </p>
      <p>{product.description}</p>

      <button disabled={product.stock === 0}>
        {product.stock > 0 ? '加入购物车' : '缺货'}
      </button>
    </div>
  )
}

// 辅助函数
async function fetchPopularProducts(): Promise<Product[]> {
  const res = await fetch('https://api.example.com/products/popular')
  return res.json()
}

async function fetchProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`https://api.example.com/products/${id}`)
    return res.json()
  } catch {
    return null
  }
}

// 优势：
// - 性能好：大部分请求返回缓存
// - 数据相对新鲜：每 60 秒更新
// - 按需生成：不需要预生成所有产品
//
// 适用场景：
// - 电商产品页（价格、库存定期更新）
// - 新闻文章（定期发布）
// - API 文档（定期更新）
//
// 工作流程：
// 1. 用户请求 /products/123
// 2. 返回缓存的 HTML（快！）
// 3. 如果超过 60 秒，后台触发重新生成
// 4. 下次请求返回新的 HTML
