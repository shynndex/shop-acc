import { useState, useEffect } from "react";
import { promotionService, Promotion, PromotionFormData } from "@/services/admin/promotion.service";

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PromotionFormData>({
    name: "",
    description: "",
    isActive: false,
    minDepositAmount: 100000,
    rewardType: "balance_bonus",
    rewardAmount: 0,
    rewardSpins: 1,
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      const response = await promotionService.getAll();
      setPromotions(response.data);
    } catch (error) {
      console.error("Failed to load promotions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await promotionService.update(editingId, formData);
      } else {
        await promotionService.create(formData);
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      loadPromotions();
    } catch (error) {
      console.error("Failed to save promotion:", error);
    }
  };

  const handleEdit = (promo: Promotion) => {
    setFormData({
      name: promo.name,
      description: promo.description,
      isActive: promo.isActive,
      minDepositAmount: promo.minDepositAmount,
      rewardType: promo.rewardType,
      rewardAmount: promo.rewardAmount,
      rewardSpins: promo.rewardSpins,
      startDate: promo.startDate.split("T")[0],
      endDate: promo.endDate.split("T")[0],
    });
    setEditingId(promo._id);
    setShowForm(true);
  };

  const handleToggle = async (id: string) => {
    try {
      await promotionService.toggleActive(id);
      loadPromotions();
    } catch (error) {
      console.error("Failed to toggle promotion:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promotion?")) return;
    try {
      await promotionService.delete(id);
      loadPromotions();
    } catch (error) {
      console.error("Failed to delete promotion:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      isActive: false,
      minDepositAmount: 100000,
      rewardType: "balance_bonus",
      rewardAmount: 0,
      rewardSpins: 1,
      startDate: "",
      endDate: "",
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("vi-VN");
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("vi-VN") + "đ";
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Khuyến mãi nạp lần đầu</h1>
        <button
          onClick={() => {
            resetForm();
            setEditingId(null);
            setShowForm(true);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          + Thêm khuyến mãi
        </button>
      </div>

      {showForm && (
        <div className="bg-white border rounded-lg p-6 mb-6 shadow">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? "Chỉnh sửa khuyến mãi" : "Thêm khuyến mãi mới"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên khuyến mãi</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border rounded px-3 py-2"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền nạp tối thiểu</label>
                <input
                  type="number"
                  value={formData.minDepositAmount}
                  onChange={(e) => setFormData({ ...formData, minDepositAmount: Number(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại thưởng</label>
                <select
                  value={formData.rewardType}
                  onChange={(e) => setFormData({ ...formData, rewardType: e.target.value as "balance_bonus" | "random_spin" })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="balance_bonus">Bonus số dư</option>
                  <option value="random_spin">Quay thưởng ngẫu nhiên</option>
                </select>
              </div>
            </div>

            {formData.rewardType === "balance_bonus" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền thưởng</label>
                <input
                  type="number"
                  value={formData.rewardAmount}
                  onChange={(e) => setFormData({ ...formData, rewardAmount: Number(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                  min={0}
                />
              </div>
            )}

            {formData.rewardType === "random_spin" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số lần quay tối đa</label>
                <input
                  type="number"
                  value={formData.rewardSpins}
                  onChange={(e) => setFormData({ ...formData, rewardSpins: Number(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                  min={1}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Kích hoạt ngay
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                {editingId ? "Cập nhật" : "Tạo mới"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  resetForm();
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tên</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Loại thưởng</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Nạp tối thiểu</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Thưởng</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Thời gian</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Đã dùng</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Trạng thái</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {promotions.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  Chưa có khuyến mãi nào
                </td>
              </tr>
            ) : (
              promotions.map((promo) => (
                <tr key={promo._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{promo.name}</div>
                    {promo.description && (
                      <div className="text-sm text-gray-500">{promo.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {promo.rewardType === "balance_bonus" ? "Bonus số dư" : "Quay thưởng"}
                  </td>
                  <td className="px-4 py-3 text-sm">{formatCurrency(promo.minDepositAmount)}</td>
                  <td className="px-4 py-3 text-sm">
                    {promo.rewardType === "balance_bonus"
                      ? formatCurrency(promo.rewardAmount)
                      : `${promo.rewardSpins} lần quay`}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div>{formatDate(promo.startDate)}</div>
                    <div className="text-gray-500">đến {formatDate(promo.endDate)}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">{promo.usedBy.length} người</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(promo._id)}
                      className={`px-2 py-1 rounded text-sm ${
                        promo.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {promo.isActive ? "Đangactive" : "Tắt"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(promo)}
                        className="text-blue-500 hover:text-blue-700 text-sm"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(promo._id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
