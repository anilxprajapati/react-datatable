// components/BulkEditModal.tsx
import { useState } from 'react';
import { Modal, Button, Row, Col, Form, Dropdown } from 'react-bootstrap';
import { BulkEditFieldConfig, BulkEditModalProps, DependentFieldConfig, TableData } from '../types';

export const BulkEditModal = <T extends TableData>({
  show,
  onHide,
  bulkEditConfig,
  selectedRows,
  onBulkEditSubmit,
  onBulkEditComplete,
  renderBulkEditForm,
}: BulkEditModalProps<T>) => {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeDependencies, setActiveDependencies] = useState<Record<string, DependentFieldConfig[]>>({});

  if (!show) return null;

  const editableFields = bulkEditConfig.filter((field) => field.isEditable !== false);

  const resetState = () => {
    setSelectedFields([]);
    setFormValues({});
    setErrors({});
    setActiveDependencies({});
  };

  const handleToggleField = (accessorKey: string) => {
    setSelectedFields((prev) =>
      prev.includes(accessorKey) ? prev.filter((key) => key !== accessorKey) : [...prev, accessorKey]
    );
    setErrors({});
  };

  const handleInputChange = (accessorKey: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [accessorKey]: value }));
    setErrors((prev) => ({ ...prev, [accessorKey]: '' }));

    const field = bulkEditConfig.find((f) => f.accessorKey === accessorKey);
    if (field?.dependencies && field.dependencies[value]) {
      setActiveDependencies((prev) => ({ ...prev, [accessorKey]: field.dependencies![value] }));
    } else {
      setActiveDependencies((prev) => {
        const newDeps = { ...prev };
        delete newDeps[accessorKey];
        return newDeps;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    selectedFields.forEach((key) => {
      const field = bulkEditConfig.find((f) => f.accessorKey === key);
      if (field?.isRequired && !formValues[key]) {
        newErrors[key] = `${field.header} is required`;
      }
    });
    Object.values(activeDependencies).flat().forEach((dep) => {
      if (dep.isRequired && !formValues[dep.accessorKey]) {
        newErrors[dep.accessorKey] = `${dep.header} is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const updatedRows = selectedRows.map((row) => ({
      ...row,
      ...formValues,
    }));

    onBulkEditSubmit(updatedRows);
    if (onBulkEditComplete) onBulkEditComplete(updatedRows);
    resetState();
    onHide();
  };

  const renderFieldInput = (field: BulkEditFieldConfig | DependentFieldConfig) => {
    const value = formValues[field.accessorKey] || '';

    switch (field.fieldType) {
      case 'select':
        return (
          <Form.Select
            value={value}
            onChange={(e) => handleInputChange(field.accessorKey, e.target.value)}
          >
            <option value="">Select {field.header}</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Form.Select>
        );
      case 'textarea':
        return (
          <Form.Control
            as="textarea"
            value={value}
            rows={3}
            onChange={(e) => handleInputChange(field.accessorKey, e.target.value)}
          />
        );
      default: // 'text' or unspecified
        return (
          <Form.Control
            type="text"
            value={value}
            onChange={(e) => handleInputChange(field.accessorKey, e.target.value)}
          />
        );
    }
  };

  return (
    <Modal show={show} onHide={() => { resetState(); onHide(); }} size="lg" top>
      <Modal.Header closeButton>
        <Modal.Title>Bulk Edit ({selectedRows.length} items)</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {renderBulkEditForm ? (
          renderBulkEditForm(selectedRows, (values) => {
            const updatedRows = selectedRows.map((row) => ({ ...row, ...values }));
            onBulkEditSubmit(updatedRows);
            if (onBulkEditComplete) onBulkEditComplete(updatedRows);
            resetState();
            onHide();
          })
        ) : (
          <form onSubmit={handleSubmit}>
            <Form.Group className="mb-4">
              <Form.Label>Select Fields to Edit</Form.Label>
              <Dropdown>
                <Dropdown.Toggle variant="outline-primary">
                  {selectedFields.length > 0
                    ? `${selectedFields.length} field(s) selected`
                    : 'Choose fields'}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {editableFields.map((field) => (
                    <Dropdown.Item key={field.accessorKey}>
                      <Form.Check
                        type="checkbox"
                        label={field.header}
                        checked={selectedFields.includes(field.accessorKey)}
                        onChange={() => handleToggleField(field.accessorKey)}
                      />
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </Form.Group>
            <Row>
              {selectedFields.map((key) => {
                const field = bulkEditConfig.find((f) => f.accessorKey === key)!;
                return (
                  <Col md={6} key={key}>
                    <Form.Group className="mb-4">
                      <Form.Label>{field.header}</Form.Label>
                      {renderFieldInput(field)}
                      {errors[key] && <div className="error-text">{errors[key]}</div>}
                      {activeDependencies[key]?.map((dep) => (
                        <div key={dep.accessorKey} className="mt-3">
                          <Form.Label>{dep.header}</Form.Label>
                          {renderFieldInput(dep)}
                          {errors[dep.accessorKey] && (
                            <div className="error-text">{errors[dep.accessorKey]}</div>
                          )}
                        </div>
                      ))}
                    </Form.Group>
                  </Col>
                );
              })}
            </Row>
          </form>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={() => { resetState(); onHide(); }}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" onClick={handleSubmit}>
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
};