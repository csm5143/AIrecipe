import 'dart:io';
import 'package:dio/dio.dart';
import '../../models/ingredient.dart';
import 'api_helpers.dart';
import 'http_client.dart';

class IngredientApi {
  final _dio = HttpClient.instance;

  Future<List<Ingredient>> getFridgeItems() {
    return guardApi(() async {
      final response = await _dio.get('/fridge/items');
      return responseList(
        response,
      ).map((item) => Ingredient.fromJson(mapValue(item))).toList();
    });
  }

  Future<Ingredient> addToFridge(Ingredient ingredient) {
    return guardApi(() async {
      final response = await _dio.post(
        '/fridge/items',
        data: ingredient.toJson(),
      );
      return Ingredient.fromJson(responseMap(response));
    });
  }

  Future<void> removeFromFridge(String id) {
    return guardApi(() async {
      await _dio.delete('/fridge/items/$id');
    });
  }

  Future<List<Ingredient>> recognizeImage(File file) {
    return guardApi(() async {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(file.path),
      });
      final response = await _dio.post(
        '/ingredients/recognize',
        data: formData,
      );
      return responseList(
        response,
      ).map((item) => Ingredient.fromJson(mapValue(item))).toList();
    });
  }
}
