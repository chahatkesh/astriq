#include "kundli_engine.hpp"

#include <iostream>
#include <iterator>
#include <stdexcept>
#include <string>

int main() {
  try {
    const std::string inputJson{
        std::istreambuf_iterator<char>(std::cin),
        std::istreambuf_iterator<char>()};

    if (inputJson.empty()) {
      throw std::runtime_error("Expected chart input JSON on stdin.");
    }

    const kundli::BirthChartInput input = kundli::parseInputJson(inputJson);
    const kundli::BirthChart chart = kundli::calculateBirthChart(input);
    std::cout << kundli::chartToJson(chart) << '\n';
    return 0;
  } catch (const std::exception& error) {
    std::cerr << error.what() << '\n';
    return 1;
  }
}
