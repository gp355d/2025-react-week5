import { useEffect, useRef, useState } from "react";
import {useForm} from "react-hook-form";
import ReactLoading from 'react-loading';

import axios from "axios";
import { Modal } from "bootstrap";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const API_PATH = import.meta.env.VITE_API_PATH;

function App() {
  const [products, setProducts] = useState([]);//儲存產品的陣列資料，預設為空陣列
  const [tempProduct, setTempProduct] = useState([]);
  const [cart, setCart] = useState({});//儲存購物車的物件資料，預設為空物件
  const [screenLoading, setScreenLoading] = useState(false);//全螢幕讀取畫面效果，預設為false
  const [isLoading, setIsLoading] = useState(false)//讀取效果，預設為false
  const [pageInfo, setPageInfo] = useState({});
  const addCartItem = async(product_id, qty) => {
    setIsLoading(true)
    try {
      const res = await axios.post(`${BASE_URL}/v2/api/${API_PATH}/cart`,{
        data:{
          product_id,
          qty: Number(qty)
        }
      })
      
      getCart();
      closeModal();
      alert(res.data.message)
    } catch (error) {
      alert(error.response.data)
    }
    finally{
      setIsLoading(false)
    }
  }
  const removeCart = async() => {
    setScreenLoading(true)
    try {
      const res =  await axios.delete(`${BASE_URL}/v2/api/${API_PATH}/carts`)
      getCart()
      alert(`所有品項${res.data.message}`)
    } catch (error) {
      alert(error.response.data)
    }
    finally{
      setScreenLoading(false)
    }
  }
  const removeCartItem = async(cartItem_id) => {
    setScreenLoading(true)
    try {
      const res = await axios.delete(`${BASE_URL}/v2/api/${API_PATH}/cart/${cartItem_id}`)
      getCart()
      alert(`該品項${res.data.message}`)
    } catch (error) {
      alert(error.response.data)
    }
    finally{
      setScreenLoading(false)
    }
  }
  const updateCartItem = async(cartItem_id, product_id, qty) => {
    try {
      const res = await axios.put(`${BASE_URL}/v2/api/${API_PATH}/cart/${cartItem_id}`,{
        data:{
          product_id,
          qty: Number(qty)
        }
      })
      alert(res.data.message)
      getCart()
    } catch (error) {
      alert(error.response.data)
    }
  }
  const getCart = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/v2/api/${API_PATH}/cart`);      
      setCart(res.data.data)
    } catch (error) {
      alert(error.response.data)
    }
  }
  const getProducts = async (page = 1) => {
    setScreenLoading(true)
    try {
      const res = await axios.get(`${BASE_URL}/v2/api/${API_PATH}/products?page=${page}`);
      setProducts(res.data.products);
      setPageInfo(res.data.pagination)
    } catch (error) {
      alert(error.res.data);
    }
    finally{
      setScreenLoading(false)
    }
  };
  useEffect(() => {
    getProducts();
    getCart();
  }, []);

  const productModalRef = useRef(null);
  useEffect(() => {
    new Modal(productModalRef.current, { backdrop: false });
  }, []);

  const openModal = () => {
    const modalInstance = Modal.getInstance(productModalRef.current);
    modalInstance.show();
  };

  const closeModal = () => {
    const modalInstance = Modal.getInstance(productModalRef.current);
    setQtySelect(1)
    modalInstance.hide();
  };

  const handleSeeMore = (product) => {
    setTempProduct(product);
    openModal();
  };
  const handlePageChange = (page,event) => {
    event.preventDefault();
    getProducts(page); //將頁數資料傳入
  };
  const [qtySelect, setQtySelect] = useState(1);
  const {
    register,
    handleSubmit,
    formState: {errors},
    reset
  } = useForm()
  const onSubmit = handleSubmit((data) => {
    const {message, ...user} = data;
  
    const userInfo = {
      data:{
        user,
        message
      }
    }    
    checkout(userInfo);
  })
  const checkout = async(data) => {
    setScreenLoading(true)
    try{
      const res = await axios.post(`${BASE_URL}/v2/api/${API_PATH}/order`, data)
      setCart({})
      alert(res.data.message)
      reset()
    }catch (error){
      alert(`結帳失敗，${error.response.data.message}`);
    }finally{
      setScreenLoading(false)
    }
  }
  return (
    <div className="container">
      <div className="mt-4">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>圖片</th>
              <th>商品名稱</th>
              <th>價格</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td style={{ width: "200px" }}>
                  <img
                    className="img-fluid"
                    src={product.imageUrl}
                    alt={product.title}
                  />
                </td>
                <td>{product.title}</td>
                <td>
                  <del className="h6">原價 {product.origin_price} 元</del>
                  <div className="h5">特價 {product.origin_price}元</div>
                </td>
                <td>
                  <div className="btn-group btn-group-sm">
                    <button
                      onClick={() => handleSeeMore(product)}
                      type="button"
                      className="btn btn-outline-secondary"
                    >
                      查看更多
                    </button>
                    <button type="button" disabled={isLoading} onClick={()=> addCartItem(product.id, 1)} className="btn btn-outline-danger d-flex align-items-center">
                      <div>加到購物車</div>{isLoading && <ReactLoading
                          type={"spin"}
                          color={"#000"}
                          height={"1.5rem"}
                          width={"1.5rem"}
                          />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
         {/* 分頁 */}
         <nav className="d-flex justify-content-center">
          <ul className="pagination">
            <li className="page-item">
              <a href="#" className={`page-link ${!pageInfo.has_pre && "disabled" }`} onClick={()=>
                handlePageChange(pageInfo.current_page - 1,event)}
                >
                上一頁
              </a>
            </li>
            {/*總頁數*/}
            {Array.from({ length: pageInfo.total_pages }).map((_, index) => {
            return (
            <li className={`page-item ${ pageInfo.current_page===index + 1 && "active" }`} key={index}>
              {" "}
              {/* 所在頁數加上active */}
              <a href="#" onClick={()=> handlePageChange(index + 1,event)}
                className="page-link"
                >
                {index + 1}
              </a>
            </li>
            );
            })}
            <li className="page-item">
              <a href="#" className={`page-link ${!pageInfo.has_next && "disabled" }`} onClick={()=>
                handlePageChange(pageInfo.current_page + 1,event)}
                >
                下一頁
              </a>
            </li>
          </ul>
        </nav>
        <div
          ref={productModalRef}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          className="modal fade"
          id="productModal"
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title fs-5">
                  產品名稱：{tempProduct.title}
                </h2>
                <button
                  onClick={closeModal}
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <img
                  src={tempProduct.imageUrl}
                  alt={tempProduct.title}
                  className="img-fluid"
                />
                <p>內容：{tempProduct.content}</p>
                <p>描述：{tempProduct.description}</p>
                <p>
                  價錢：{tempProduct.price}{" "}
                  <del>{tempProduct.origin_price}</del> 元
                </p>
                <div className="input-group align-items-center">
                  <label htmlFor="qtySelect">數量：</label>
                  <select
                    value={qtySelect}
                    onChange={(e) => setQtySelect(e.target.value)}
                    id="qtySelect"
                    className="form-select"
                  >
                    {Array.from({ length: 10 }).map((_, index) => (
                      <option key={index} value={index + 1}>
                        {index + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button disabled={isLoading} onClick={() => addCartItem(tempProduct.id, qtySelect)} type="button" className="btn btn-primary d-flex align-items-center">
                <div>加入購物車</div>
                {isLoading && <ReactLoading
                      type={"spin"}
                      color={"#000"}
                      height={"1.5rem"}
                      width={"1.5rem"}
                      />}
                </button>
              </div>
            </div>
          </div>
        </div>
        {cart.carts?.length > 0 &&(
         <div>
        <div className="text-end py-3">
          <button onClick={removeCart} className="btn btn-outline-danger" type="button">
            清空購物車
          </button>
        </div>

        <table className="table align-middle">
          <thead>
            <tr>
              <th></th>
              <th>品名</th>
              <th style={{ width: "150px" }}>數量/單位</th>
              <th className="text-end">單價</th>
            </tr>
          </thead>
            <tbody>
              {cart.carts?.map((cartItem) => (
                <tr key={cartItem.id}>
                  <td>
                    <button onClick={()=> removeCartItem(cartItem.id)} type="button" className="btn btn-outline-danger btn-sm">
                    x
                    </button>
                  </td>
                  <td>{cartItem.product.title}</td>
                  <td style={{ width: "150px" }}>
                    <div className="d-flex align-items-center">
                      <div className="btn-group me-2" role="group">
                        <button
                          onClick={() => updateCartItem(cartItem.id, cartItem.product_id, cartItem.qty - 1)}
                          type="button"
                          disabled={cartItem.qty === 1}
                          className="btn btn-outline-dark btn-sm"
                        >
                          -
                        </button>
                        <span
                          className="btn border border-dark"
                          style={{ width: "50px", cursor: "auto" }}
                        >{cartItem.qty}</span>
                        <button
                          onClick={() => updateCartItem(cartItem.id, cartItem.product_id, cartItem.qty + 1)}
                          type="button"
                          className="btn btn-outline-dark btn-sm"
                        >
                          +
                        </button>
                      </div>
                      <span className="input-group-text bg-transparent border-0">
                        {cartItem.product.unit}
                      </span>
                    </div>
                  </td>
                  <td className="text-end">{cartItem.total}</td>
                </tr>
              ))}
            </tbody>
          <tfoot>
            <tr>
              <td colSpan="3" className="text-end">
                總計：
              </td>
              <td className="text-end" style={{ width: "130px" }}></td>
            </tr>
          </tfoot>
        </table>
        </div>
              )}
      </div>
      <div className="my-5 row justify-content-center">
        <form onSubmit={onSubmit} className="col-md-6">
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
            {...register('email', {
              required: '此欄位必填',
              pattern:{
                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                message: '格式錯誤，請輸入正確Email'
              }
            })}
              id="email"
              type="email"
              className="form-control"
              placeholder="請輸入 Email"
            />

            {errors.email && <p className="text-danger my-2">{errors.email.message}</p> }
          </div>

          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              收件人姓名
            </label>
            <input
            {...register('name', {
              required:'姓名欄位必填'
            })}
              id="name"
              className="form-control"
              placeholder="請輸入姓名"
            />

            {errors.name && <p className="text-danger my-2">{errors.name.message}</p>}
          </div>

          <div className="mb-3">
            <label htmlFor="tel" className="form-label">
              收件人電話
            </label>
            <input
            {...register('tel', {
              required: '此欄位必填',
              pattern:{
                value: /^(0[2-8]\d{7}|09\d{8})$/,
                message: '格式錯誤，請輸入正確電話'
              }
            })}
              id="tel"
              type="tel"
              className="form-control"
              placeholder="請輸入電話"
            />

            {errors.tel && <p className="text-danger my-2">{errors.tel.message}</p>}
          </div>

          <div className="mb-3">
            <label htmlFor="address" className="form-label">
              收件人地址
            </label>
            <input
            {...register('address', {
              required: '此欄位必填',
            })}
              id="address"
              type="text"
              className="form-control"
              placeholder="請輸入地址"
            />

            {errors.address && <p className="text-danger my-2">{errors.address.message}</p>}
          </div>

          <div className="mb-3">
            <label htmlFor="message" className="form-label">
              留言
            </label>
            <textarea
            {...register('message')}
              id="message"
              className="form-control"
              cols="30"
              rows="10"
            ></textarea>
          </div>
          <div className="text-end">
            <button type="submit" className="btn btn-danger" disabled={cart.carts?.length === 0}>
              送出訂單
            </button>
          </div>
        </form>
    </div>
    {screenLoading && (<div
        className="d-flex justify-content-center align-items-center"
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(255,255,255,0.3)",
          zIndex: 999,
        }}
      >
        <ReactLoading type="spin" color="black" width="4rem" height="4rem" />
      </div>)}
    </div>
  );
}

export default App;

